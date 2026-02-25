// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract TurmericSupplyChain is AccessControl {
    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");
    bytes32 public constant PROCESSOR_ROLE = keccak256("PROCESSOR_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant SUPPLIER_ROLE = keccak256("SUPPLIER_ROLE");
    bytes32 public constant SHOPKEEPER_ROLE = keccak256("SHOPKEEPER_ROLE");

    struct Packet {
        string unique_packet_id;
        string batch_id;
        string current_stage;
        bool exists;
    }

    struct Harvest {
        string farmer_id;
        string product_name;
        string batch_id;
        string harvest_date;
        string gps_coordinates;
        string fertilizer;
        string organic_status;
        uint256 quantity_gm;  // raw turmeric quantity in grams (before processing loss)
    }

    struct Processing {
        string batch_id;
        string processing_gps;
        string grinding_facility_name;
        uint256 moisture_content;
        uint256 curcumin_content;
        string heavy_metals;
        string physical_properties;
        string packaging_date;
        string packaging_unit;
        string packet_id;
        string expiry_date;
        string sending_box_code;
        string distributor_id;
    }

    // Batch-level processing info (no packet_id) - set once per batch when creating packets
    struct BatchProcessing {
        string batch_id;
        string processing_gps;
        string grinding_facility_name;
        uint256 moisture_content;
        uint256 curcumin_content;
        string heavy_metals;
        string physical_properties;
        string packaging_date;
        string packaging_unit;
        string expiry_date;
        string sending_box_code;
        string distributor_id;
    }

    struct Distributor {
        string distributor_id;
        string gps_coordinates;
        string received_box_code;
        string dispatch_date;
        string sending_box_code;
        string supplier_id;
    }

    struct Supplier {
        string supplier_id;
        string received_box_code;
        string gps_coordinates;
        string receipt_date;
        string shopkeeper_id;
        string packet_id;
    }

    struct Shopkeeper {
        string shopkeeper_id;
        string packet_id;
        string gps_coordinates;
        string date_received;
    }

    mapping(string => Packet) private packets;
    mapping(string => Harvest) private harvests;
    mapping(string => Processing) private processings;
    mapping(string => BatchProcessing) private batchProcessings;
    mapping(string => Distributor) private distributors;
    mapping(string => Supplier) private suppliers;
    mapping(string => Shopkeeper) private shopkeepers;

    // Track packet count per batch
    mapping(string => uint256) public batchPacketCount;
    // Track batch IDs per farmer (farmer_id => batch_id => exists)
    mapping(string => mapping(string => bool)) private farmerBatches;
    // Track all farmers (farmer_id => exists)
    mapping(string => bool) private farmers;
    // Track all batch IDs for querying
    mapping(string => bool) private batchIds;
    // Ensure packet uniqueness globally
    mapping(string => bool) private packetExists;
    // Ensure batch uniqueness per farmer (farmer_id + batch_id => exists)
    mapping(string => bool) private farmerBatchExists;

    event PacketRegistered(string indexed unique_packet_id, string batch_id, string current_stage);
    event PacketStageUpdated(string indexed unique_packet_id, string previous_stage, string new_stage);
    event HarvestRegistered(string indexed farmer_id, string indexed batch_id);
    // Unindexed copy of harvest registration for easier off-chain querying
    event HarvestRecorded(string farmer_id, string batch_id);
    event PacketCountUpdated(string indexed batch_id, uint256 count);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ---------------- ADD FUNCTIONS ----------------
    function addHarvest(string memory batch_id, Harvest memory h) public onlyRole(FARMER_ROLE) {
        // Ensure batch_id matches the harvest batch_id
        require(keccak256(bytes(h.batch_id)) == keccak256(bytes(batch_id)), "Batch ID mismatch");
        
        // Create unique key for farmer+batch combination
        string memory farmerBatchKey = string(abi.encodePacked(h.farmer_id, "_", batch_id));
        require(!farmerBatchExists[farmerBatchKey], "Batch ID already exists for this farmer");
        
        // Mark farmer and batch as existing
        farmers[h.farmer_id] = true;
        batchIds[batch_id] = true;
        farmerBatches[h.farmer_id][batch_id] = true;
        farmerBatchExists[farmerBatchKey] = true;
        
        harvests[batch_id] = h;
        emit HarvestRegistered(h.farmer_id, batch_id);
        emit HarvestRecorded(h.farmer_id, batch_id);
    }

    // Set batch-level processing info once per batch (no packet registration)
    function setBatchProcessing(string memory batch_id, BatchProcessing memory bp) public onlyRole(PROCESSOR_ROLE) {
        require(keccak256(bytes(bp.batch_id)) == keccak256(bytes(batch_id)), "Batch ID mismatch");
        require(batchIds[batch_id], "Batch ID does not exist.");
        batchProcessings[batch_id] = bp;
    }

    function addProcessing(string memory batch_id, Processing memory p) public onlyRole(PROCESSOR_ROLE) {
        // Ensure batch_id matches
        require(keccak256(bytes(p.batch_id)) == keccak256(bytes(batch_id)), "Batch ID mismatch");
        
        // Ensure packet is unique globally
        require(!packetExists[p.packet_id], "Packet ID already exists");
        
        // Verify batch exists (harvest must be registered first)
        require(batchIds[batch_id], "Batch ID does not exist. Harvest must be registered first.");
        
        // Increment packet count for this batch
        batchPacketCount[batch_id] = batchPacketCount[batch_id] + 1;
        
        // Mark packet as existing
        packetExists[p.packet_id] = true;
        
        processings[batch_id] = p;

        // Register packet
        packets[p.packet_id] = Packet(p.packet_id, batch_id, "processing", true);
        emit PacketRegistered(p.packet_id, batch_id, "processing");
        emit PacketCountUpdated(batch_id, batchPacketCount[batch_id]);
    }

    function addDistributor(string memory packet_id, Distributor memory d) public onlyRole(DISTRIBUTOR_ROLE) {
        distributors[packet_id] = d;

        if (packets[packet_id].exists) {
            string memory prev = packets[packet_id].current_stage;
            packets[packet_id].current_stage = "distributor";
            emit PacketStageUpdated(packet_id, prev, "distributor");
        }
    }

    function addSupplier(string memory packet_id, Supplier memory s) public onlyRole(SUPPLIER_ROLE) {
        suppliers[packet_id] = s;

        if (packets[packet_id].exists) {
            string memory prev = packets[packet_id].current_stage;
            packets[packet_id].current_stage = "supplier";
            emit PacketStageUpdated(packet_id, prev, "supplier");
        }
    }

    function addShopkeeper(string memory packet_id, Shopkeeper memory sh) public onlyRole(SHOPKEEPER_ROLE) {
        shopkeepers[packet_id] = sh;

        if (packets[packet_id].exists) {
            string memory prev = packets[packet_id].current_stage;
            packets[packet_id].current_stage = "shopkeeper";
            emit PacketStageUpdated(packet_id, prev, "shopkeeper");
        }
    }

    function addPacket(string memory packet_id, Packet memory p) public onlyRole(PROCESSOR_ROLE) {
        require(!packetExists[packet_id], "Packet ID already exists");
        require(batchIds[p.batch_id], "Batch ID does not exist.");
        packetExists[packet_id] = true;
        batchPacketCount[p.batch_id] = batchPacketCount[p.batch_id] + 1;
        packets[packet_id] = p;
        emit PacketRegistered(p.unique_packet_id, p.batch_id, p.current_stage);
        emit PacketCountUpdated(p.batch_id, batchPacketCount[p.batch_id]);
    }

    /// @notice Register multiple packets in one transaction (avoids nonce issues when creating many packets).
    function addPacketsInBatch(string memory batch_id, string[] calldata packet_ids) public onlyRole(PROCESSOR_ROLE) {
        require(batchIds[batch_id], "Batch does not exist.");
        for (uint256 i = 0; i < packet_ids.length; i++) {
            string memory pid = packet_ids[i];
            require(!packetExists[pid], "Packet ID already exists");
            packetExists[pid] = true;
            batchPacketCount[batch_id] = batchPacketCount[batch_id] + 1;
            packets[pid] = Packet(pid, batch_id, "processing", true);
            emit PacketRegistered(pid, batch_id, "processing");
        }
        if (packet_ids.length > 0) {
            emit PacketCountUpdated(batch_id, batchPacketCount[batch_id]);
        }
    }

    /// @notice Create multiple packets in one tx; contract generates unique IDs (keccak256(batchId, index, block.timestamp))-style uniqueness.
    /// IDs are readable: farmerId-batchId-{weight}g-{seq}.
    function createPackets(string memory batch_id, string memory farmer_id, uint256 count, uint256 weightPerPacketGm) public onlyRole(PROCESSOR_ROLE) {
        require(batchIds[batch_id], "Batch does not exist.");
        require(count > 0 && count <= 500, "Count must be 1-500");
        uint256 startIndex = batchPacketCount[batch_id];
        for (uint256 i = 0; i < count; i++) {
            uint256 seq = startIndex + i + 1;
            string memory packetId = string(abi.encodePacked(
                farmer_id, "-", batch_id, "-", _uint2str(weightPerPacketGm), "g-",
                _padSeq(seq)
            ));
            require(!packetExists[packetId], "Packet ID already exists");
            packetExists[packetId] = true;
            batchPacketCount[batch_id] = batchPacketCount[batch_id] + 1;
            packets[packetId] = Packet(packetId, batch_id, "processing", true);
            emit PacketRegistered(packetId, batch_id, "processing");
        }
        emit PacketCountUpdated(batch_id, batchPacketCount[batch_id]);
    }

    /// Pad sequence to at least 3 digits: 1 -> "001", 12 -> "012", 123 -> "123"
    function _padSeq(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "000";
        string memory s = _uint2str(_i);
        if (bytes(s).length >= 3) return s;
        if (bytes(s).length == 1) return string(abi.encodePacked("00", s));
        return string(abi.encodePacked("0", s));
    }

    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory b = new bytes(len);
        uint256 k = len;
        j = _i;
        while (j != 0) {
            k = k > 0 ? k - 1 : 0;
            uint8 t = uint8(48 + j % 10);
            b[k] = bytes1(t);
            j /= 10;
        }
        return string(b);
    }

    // ---------------- READ FUNCTIONS ----------------
    function getPacket(string memory packet_id) public view returns (Packet memory) {
        return packets[packet_id];
    }

    function getHarvest(string memory batch_id) public view returns (Harvest memory) {
        return harvests[batch_id];
    }

    function getProcessing(string memory batch_id) public view returns (Processing memory) {
        return processings[batch_id];
    }

    function getDistributor(string memory packet_id) public view returns (Distributor memory) {
        return distributors[packet_id];
    }

    function getSupplier(string memory packet_id) public view returns (Supplier memory) {
        return suppliers[packet_id];
    }

    function getShopkeeper(string memory packet_id) public view returns (Shopkeeper memory) {
        return shopkeepers[packet_id];
    }

    // ---------------- NEW GETTER FUNCTIONS ----------------
    // Get packet count for a batch
    function getBatchPacketCount(string memory batch_id) public view returns (uint256) {
        return batchPacketCount[batch_id];
    }
    
    // Check if batch exists
    function batchExists(string memory batch_id) public view returns (bool) {
        return batchIds[batch_id];
    }
    
    // Check if packet exists
    function packetIdExists(string memory packet_id) public view returns (bool) {
        return packetExists[packet_id];
    }
    
    // Check if batch exists for a specific farmer
    function checkFarmerBatchExists(string memory farmer_id, string memory batch_id) public view returns (bool) {
        string memory farmerBatchKey = string(abi.encodePacked(farmer_id, "_", batch_id));
        return farmerBatchExists[farmerBatchKey];
    }
    
    // Get harvest for a batch (to retrieve farmer_id)
    function getHarvestForBatch(string memory batch_id) public view returns (Harvest memory) {
        return harvests[batch_id];
    }

    // Get batch-level processing for a batch
    function getBatchProcessing(string memory batch_id) public view returns (BatchProcessing memory) {
        return batchProcessings[batch_id];
    }
}
