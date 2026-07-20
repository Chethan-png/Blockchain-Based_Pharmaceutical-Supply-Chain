package main

import (
	"encoding/json"
	"fmt"
	"time"
	"regexp"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing drugs
type SmartContract struct {
	contractapi.Contract
}

// Drug defines the structure for a drug batch
type Drug struct {
	BatchID      string   `json:"batchId"`
	Name         string   `json:"name"`
	Manufacturer string   `json:"manufacturer"`
	ExpiryDate   string   `json:"expiryDate"`
	Status       string   `json:"status"`
	Location     string   `json:"location"`
	Owner        string   `json:"owner"`
	OwnerRole    string   `json:"ownerRole"`
	Recalled     bool     `json:"recalled"`
	Notes        []string `json:"notes"`
	Timestamp    string   `json:"timestamp"`
}

// getTxTimestamp returns a deterministic timestamp derived from the transaction
// proposal itself, so all endorsing peers compute the identical value.
// Using time.Now() instead would cause endorsement mismatches across peers.
func getTxTimestamp(ctx contractapi.TransactionContextInterface) (string, error) {
	ts, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return "", fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	t := time.Unix(ts.Seconds, int64(ts.Nanos)).UTC()
	return t.Format(time.RFC3339), nil
}

// InitLedger adds a base set of drugs to the ledger
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	timestamp, err := getTxTimestamp(ctx)
	if err != nil {
		return err
	}

	drugs := []Drug{
		{
			BatchID:      "DRG001",
			Name:         "Paracetamol",
			Manufacturer: "PharmaCorp",
			ExpiryDate:   "2024-12-31",
			Status:       "Manufactured",
			Location:     "Factory A",
			Owner:        "Manufacturer",
			OwnerRole:    "manufacturer",
			Recalled:     false,
			Notes:        []string{"Initial batch"},
			Timestamp:    timestamp,
		},
	}

	for _, drug := range drugs {
		drugJSON, err := json.Marshal(drug)
		if err != nil {
			return err
		}
		if err := ctx.GetStub().PutState(drug.BatchID, drugJSON); err != nil {
			return fmt.Errorf("failed to put to world state: %v", err)
		}
	}
	return nil
}

// RegisterDrug allows a manufacturer to add a new drug
func (s *SmartContract) RegisterDrug(ctx contractapi.TransactionContextInterface, batchID, name, manufacturer, expiryDate string) error {
	role, err := getClientRole(ctx)
	if err != nil {
		return err
	}
	if role != "manufacturer" {
		return fmt.Errorf("only manufacturers can register drugs")
	}

	exists, err := s.DrugExists(ctx, batchID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("drug %s already exists", batchID)
	}

	clientID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client ID: %v", err)
	}

	timestamp, err := getTxTimestamp(ctx)
	if err != nil {
		return err
	}

	drug := Drug{
		BatchID:      batchID,
		Name:         name,
		Manufacturer: manufacturer,
		ExpiryDate:   expiryDate,
		Status:       "Manufactured",
		Location:     "Manufacturing Facility",
		Owner:        clientID,
		OwnerRole:    role,
		Recalled:     false,
		Notes:        []string{"Drug registered in system"},
		Timestamp:    timestamp,
	}

	drugJSON, err := json.Marshal(drug)
	if err != nil {
		return err
	}
	ctx.GetStub().SetEvent("DrugRegistered", []byte(batchID))
	return ctx.GetStub().PutState(batchID, drugJSON)
}

// VerifyDrug returns the current drug object by ID
func (s *SmartContract) VerifyDrug(ctx contractapi.TransactionContextInterface, batchID string) (*Drug, error) {
	data, err := ctx.GetStub().GetState(batchID)
	if err != nil || data == nil {
		return nil, fmt.Errorf("drug %s not found", batchID)
	}
	var drug Drug
	if err := json.Unmarshal(data, &drug); err != nil {
		return nil, err
	}
	return &drug, nil
}

// Helper function to extract CN from identity string
func getCNFromIdentity(idString string) (string, error) {
	// Example ID: x509::/OU=client/OU=org1/OU=department1/CN=user1::/C=US/ST=North Carolina/L=Raleigh/O=org1.example.com/CN=ca.org1.example.com
	// Regex updated to be less greedy and find the first CN= part specifically related to the user, before the issuer part
	re := regexp.MustCompile(`/CN=([^:/]+)`)
	matches := re.FindStringSubmatch(idString)
	if len(matches) < 2 {
		// Simplified: return error if CN parsing fails, rely on hf.EnrollmentID in the main function
		return "", fmt.Errorf("could not extract user CN from identity string: %s", idString)
	}
	// Return the first CN found
	return matches[1], nil
}

func (s *SmartContract) UpdateLocation(ctx contractapi.TransactionContextInterface, batchID, newLocation string) error {
	drug, err := s.VerifyDrug(ctx, batchID)
	if err != nil {
		return err
	}

	// --- Ownership Check Logic ---
	var clientOwnerIdentifier string

	// 1. Try getting hf.EnrollmentID first (most reliable if set during enrollment)
	enrollmentID, ok, errAttr := ctx.GetClientIdentity().GetAttributeValue("hf.EnrollmentID")
	if errAttr != nil {
		// Log error but don't fail yet, try CN parsing
		fmt.Printf("Attribute hf.EnrollmentID retrieval error: %v\n", errAttr)
	}
	if ok && enrollmentID != "" {
		clientOwnerIdentifier = enrollmentID
	} else {
		// 2. Fallback: Parse CN from the ID string if attribute not found/empty
		clientIDString, err := ctx.GetClientIdentity().GetID()
		if err != nil {
			return fmt.Errorf("failed to get client identity string: %v", err)
		}
		cn, errCN := getCNFromIdentity(clientIDString)
		if errCN != nil {
			// 3. If both fail, return error
			return fmt.Errorf("failed to determine client owner identifier: Cannot get hf.EnrollmentID (found: %v, value: '%s') and cannot extract CN (%v) from ID: %s", ok, enrollmentID, errCN, clientIDString)
		}
		clientOwnerIdentifier = cn
	}
	// --- End Ownership Check Logic ---

	// Compare the determined client identifier with the stored drug owner
	// Also handle the initial owner case where drug.Owner might be the full ID
	if clientOwnerIdentifier != drug.Owner {
		// Check if the drug owner is the full ID string (initial owner case)
		// This might be needed if the initial owner didn't get transferred yet
		clientIDStringForCompare, _ := ctx.GetClientIdentity().GetID() // Get ID again for comparison if needed
		if clientIDStringForCompare != drug.Owner {
			return fmt.Errorf("permission denied: client '%s' is not the current owner '%s'", clientOwnerIdentifier, drug.Owner)
		}
		// If it matches the full ID, allow the update (covers initial owner)
	}

	timestamp, err := getTxTimestamp(ctx)
	if err != nil {
		return err
	}

	drug.Location = newLocation
	drug.Timestamp = timestamp
	drug.Notes = append(drug.Notes, fmt.Sprintf("Location updated to %s by %s at %s", newLocation, clientOwnerIdentifier, drug.Timestamp)) // Log who updated
	drugJSON, _ := json.Marshal(drug)
	ctx.GetStub().SetEvent("DrugLocationUpdated", []byte(batchID))
	return ctx.GetStub().PutState(batchID, drugJSON)
}

func (s *SmartContract) UpdateStatus(ctx contractapi.TransactionContextInterface, batchID, newStatus string) error {
	drug, err := s.VerifyDrug(ctx, batchID)
	if err != nil {
		return err
	}
	// --- Ownership Check Logic --- (Apply similar logic as UpdateLocation)
	var clientOwnerIdentifier string
	enrollmentID, ok, errAttr := ctx.GetClientIdentity().GetAttributeValue("hf.EnrollmentID")
	if errAttr != nil { fmt.Printf("Attribute hf.EnrollmentID retrieval error: %v\n", errAttr) }
	if ok && enrollmentID != "" {
		clientOwnerIdentifier = enrollmentID
	} else {
		clientIDString, err := ctx.GetClientIdentity().GetID()
		if err != nil { return fmt.Errorf("failed to get client identity string: %v", err) }
		cn, errCN := getCNFromIdentity(clientIDString)
		if errCN != nil { return fmt.Errorf("failed to determine client owner identifier: Cannot get hf.EnrollmentID (found: %v, value: '%s') and cannot extract CN (%v) from ID: %s", ok, enrollmentID, errCN, clientIDString) }
		clientOwnerIdentifier = cn
	}
	// --- End Ownership Check Logic ---

	if clientOwnerIdentifier != drug.Owner {
		clientIDStringForCompare, _ := ctx.GetClientIdentity().GetID()
		if clientIDStringForCompare != drug.Owner {
			return fmt.Errorf("permission denied: client '%s' is not the current owner '%s'", clientOwnerIdentifier, drug.Owner)
		}
	}

	timestamp, err := getTxTimestamp(ctx)
	if err != nil {
		return err
	}

	drug.Status = newStatus
	drug.Timestamp = timestamp
	drug.Notes = append(drug.Notes, fmt.Sprintf("Status updated to %s by %s at %s", newStatus, clientOwnerIdentifier, drug.Timestamp)) // Log who updated
	drugJSON, _ := json.Marshal(drug)
	ctx.GetStub().SetEvent("DrugStatusUpdated", []byte(batchID))
	return ctx.GetStub().PutState(batchID, drugJSON)
}

func (s *SmartContract) TransferOwnership(ctx contractapi.TransactionContextInterface, batchID, newOwner, newRole string) error {
	drug, err := s.VerifyDrug(ctx, batchID)
	if err != nil {
		return err
	}
	// --- Ownership Check Logic --- (Apply similar logic as UpdateLocation for the *current* owner check)
	var clientOwnerIdentifier string
	enrollmentID, ok, errAttr := ctx.GetClientIdentity().GetAttributeValue("hf.EnrollmentID")
	if errAttr != nil { fmt.Printf("Attribute hf.EnrollmentID retrieval error: %v\n", errAttr) }
	if ok && enrollmentID != "" {
		clientOwnerIdentifier = enrollmentID
	} else {
		clientIDString, err := ctx.GetClientIdentity().GetID()
		if err != nil { return fmt.Errorf("failed to get client identity string: %v", err) }
		cn, errCN := getCNFromIdentity(clientIDString)
		if errCN != nil { return fmt.Errorf("failed to determine client owner identifier: Cannot get hf.EnrollmentID (found: %v, value: '%s') and cannot extract CN (%v) from ID: %s", ok, enrollmentID, errCN, clientIDString) }
		clientOwnerIdentifier = cn
	}
	// --- End Ownership Check Logic ---

	if clientOwnerIdentifier != drug.Owner {
		clientIDStringForCompare, _ := ctx.GetClientIdentity().GetID()
		if clientIDStringForCompare != drug.Owner {
			// Use clientOwnerIdentifier in the error message for clarity
			return fmt.Errorf("permission denied: client '%s' is not the current owner '%s' and cannot transfer ownership", clientOwnerIdentifier, drug.Owner)
		}
	}

	// --- Role Transition Logic --- (Existing logic is likely fine)
	allowed := map[string][]string{
		"manufacturer": {"wholesaler"},
		"wholesaler":   {"distributor"},
		"distributor":  {"pharmacy"},
		"pharmacy":     {}, // Changed from {"customer"} - assuming customer doesn't own/update via chaincode? Review this.
	}

	validRoles := allowed[drug.OwnerRole]
	isValid := false
	for _, r := range validRoles {
		if r == newRole {
			isValid = true
			break
		}
	}
	if !isValid {
		// Check if the owner is a pharmacy and newRole is empty (end of chain)
		if !(drug.OwnerRole == "pharmacy" && newRole == "") { // Allow pharmacy to end chain implicitly? Or require specific action?
		   return fmt.Errorf("invalid transition from %s to %s", drug.OwnerRole, newRole)
		}
		// If pharmacy and newRole is empty/not specified, maybe just update status? Or is this transfer meant for a customer?
        // For now, we proceed but this transition logic might need refinement based on requirements.
	}
	// --- End Role Transition Logic ---

	timestamp, err := getTxTimestamp(ctx)
	if err != nil {
		return err
	}

	prevOwner := drug.Owner // Store previous owner string/ID
	drug.Owner = newOwner    // Set to the new username string
	drug.OwnerRole = newRole
	drug.Timestamp = timestamp
	// Log includes the identifier of the one performing the transfer (clientOwnerIdentifier)
	drug.Notes = append(drug.Notes, fmt.Sprintf("Transferred from %s to %s (%s) by %s at %s", prevOwner, newOwner, newRole, clientOwnerIdentifier, drug.Timestamp))
	drugJSON, _ := json.Marshal(drug)
	ctx.GetStub().SetEvent("DrugOwnershipTransferred", []byte(batchID))
	return ctx.GetStub().PutState(batchID, drugJSON)
}

func (s *SmartContract) RecallDrug(ctx contractapi.TransactionContextInterface, batchID string) error {
	role, err := getClientRole(ctx)
	if err != nil || role != "manufacturer" {
		return fmt.Errorf("only manufacturers can recall drugs")
	}
	drug, err := s.VerifyDrug(ctx, batchID)
	if err != nil {
		return err
	}

	timestamp, err := getTxTimestamp(ctx)
	if err != nil {
		return err
	}

	drug.Recalled = true
	drug.Timestamp = timestamp
	drug.Notes = append(drug.Notes, fmt.Sprintf("Recalled by manufacturer at %s", drug.Timestamp))
	drugJSON, _ := json.Marshal(drug)
	ctx.GetStub().SetEvent("DrugRecalled", []byte(batchID))
	return ctx.GetStub().PutState(batchID, drugJSON)
}

func (s *SmartContract) AddNote(ctx contractapi.TransactionContextInterface, batchID, note string) error {
	drug, err := s.VerifyDrug(ctx, batchID)
	if err != nil {
		return err
	}
	// --- Ownership Check Logic --- (Apply similar logic as UpdateLocation)
	var clientOwnerIdentifier string
	enrollmentID, ok, errAttr := ctx.GetClientIdentity().GetAttributeValue("hf.EnrollmentID")
	if errAttr != nil { fmt.Printf("Attribute hf.EnrollmentID retrieval error: %v\n", errAttr) }
	if ok && enrollmentID != "" {
		clientOwnerIdentifier = enrollmentID
	} else {
		clientIDString, err := ctx.GetClientIdentity().GetID()
		if err != nil { return fmt.Errorf("failed to get client identity string: %v", err) }
		cn, errCN := getCNFromIdentity(clientIDString)
		if errCN != nil { return fmt.Errorf("failed to determine client owner identifier: Cannot get hf.EnrollmentID (found: %v, value: '%s') and cannot extract CN (%v) from ID: %s", ok, enrollmentID, errCN, clientIDString) }
		clientOwnerIdentifier = cn
	}
	// --- End Ownership Check Logic ---

	if clientOwnerIdentifier != drug.Owner {
		clientIDStringForCompare, _ := ctx.GetClientIdentity().GetID()
		if clientIDStringForCompare != drug.Owner {
			return fmt.Errorf("permission denied: client '%s' is not the current owner '%s'", clientOwnerIdentifier, drug.Owner)
		}
	}

	timestamp, err := getTxTimestamp(ctx)
	if err != nil {
		return err
	}

	drug.Notes = append(drug.Notes, fmt.Sprintf("Note added by %s: %s", clientOwnerIdentifier, note)) // Log who added note
	drug.Timestamp = timestamp // Update timestamp when note added
	drugJSON, _ := json.Marshal(drug)
	return ctx.GetStub().PutState(batchID, drugJSON)
}

func (s *SmartContract) GetNotes(ctx contractapi.TransactionContextInterface, batchID string) ([]string, error) {
	drug, err := s.VerifyDrug(ctx, batchID)
	if err != nil {
		return nil, err
	}
	return drug.Notes, nil
}

func (s *SmartContract) IsExpired(ctx contractapi.TransactionContextInterface, batchID string) (bool, error) {
	drug, err := s.VerifyDrug(ctx, batchID)
	if err != nil {
		return false, err
	}
	expiry, err := time.Parse("2006-01-02", drug.ExpiryDate)
	if err != nil {
		return false, err
	}
	// Note: this is a read-only query, not a state write, so using wall-clock
	// time.Now() here is fine — it does not need to match across endorsing peers.
	return time.Now().After(expiry), nil
}

func (s *SmartContract) GetDrugHistory(ctx contractapi.TransactionContextInterface, batchID string) ([]*Drug, error) {
	iter, err := ctx.GetStub().GetHistoryForKey(batchID)
	if err != nil {
		return nil, err
	}
	defer iter.Close()
	var history []*Drug
	for iter.HasNext() {
		resp, err := iter.Next()
		if err != nil {
			return nil, err
		}
		var drug Drug
		if len(resp.Value) > 0 {
			json.Unmarshal(resp.Value, &drug)
		} else {
			drug = Drug{BatchID: batchID}
		}
		history = append(history, &drug)
	}
	return history, nil
}

func (s *SmartContract) GetAllDrugs(ctx contractapi.TransactionContextInterface) ([]*Drug, error) {
	iter, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer iter.Close()
	var drugs []*Drug
	for iter.HasNext() {
		resp, err := iter.Next()
		if err != nil {
			return nil, err
		}
		var drug Drug
		if err := json.Unmarshal(resp.Value, &drug); err != nil {
			return nil, err
		}
		drugs = append(drugs, &drug)
	}
	return drugs, nil
}

func getClientRole(ctx contractapi.TransactionContextInterface) (string, error) {
	role, found, err := ctx.GetClientIdentity().GetAttributeValue("role")
	if err != nil {
		return "", fmt.Errorf("error getting role: %v", err)
	}
	if !found {
		return "", fmt.Errorf("role attribute not found")
	}
	return role, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		fmt.Printf("Error creating chaincode: %v\n", err)
		return
	}
	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting chaincode: %v\n", err)
	}
}

// DrugExists returns true if the drug with the given ID exists in the world state
func (s *SmartContract) DrugExists(ctx contractapi.TransactionContextInterface, batchID string) (bool, error) {
	drugJSON, err := ctx.GetStub().GetState(batchID)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}
	return drugJSON != nil, nil
}