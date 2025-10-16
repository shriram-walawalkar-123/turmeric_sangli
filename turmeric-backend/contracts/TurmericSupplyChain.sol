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
    mapping(string => Distributor) private distributors;
    mapping(string => Supplier) private suppliers;
    mapping(string => Shopkeeper) private shopkeepers;

    event PacketRegistered(string indexed unique_packet_id, string batch_id, string current_stage);
    event PacketStageUpdated(string indexed unique_packet_id, string previous_stage, string new_stage);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ---------------- ADD FUNCTIONS ----------------
    function addHarvest(string memory batch_id, Harvest memory h) public onlyRole(FARMER_ROLE) {
        harvests[batch_id] = h;
    }

    function addProcessing(string memory batch_id, Processing memory p) public onlyRole(PROCESSOR_ROLE) {
        processings[batch_id] = p;

        // automatically register packet if new
        if (!packets[p.packet_id].exists) {
            packets[p.packet_id] = Packet(p.packet_id, batch_id, "processing", true);
            emit PacketRegistered(p.packet_id, batch_id, "processing");
        } else {
            string memory prev = packets[p.packet_id].current_stage;
            packets[p.packet_id].current_stage = "processing";
            emit PacketStageUpdated(p.packet_id, prev, "processing");
        }
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
        packets[packet_id] = p;
        emit PacketRegistered(p.unique_packet_id, p.batch_id, p.current_stage);
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

    
}
