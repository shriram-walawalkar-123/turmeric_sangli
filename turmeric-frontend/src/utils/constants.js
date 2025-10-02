import { Camera, Package, Truck, Store, Building2, Shield } from 'lucide-react';

export const ROLES = [
  { 
    id: 'admin', 
    name: 'Admin', 
    icon: Shield, 
    color: 'purple',
    description: 'Monitor all supply chain stages'
  },
  { 
    id: 'farmer', 
    name: 'Farmer', 
    icon: Camera, 
    color: 'green',
    description: 'Record harvest data'
  },
  { 
    id: 'processor', 
    name: 'Processor', 
    icon: Package, 
    color: 'blue',
    description: 'Add processing and packaging info'
  },
  { 
    id: 'distributor', 
    name: 'Distributor', 
    icon: Truck, 
    color: 'orange',
    description: 'Manage distribution logistics'
  },
  { 
    id: 'supplier', 
    name: 'Supplier', 
    icon: Building2, 
    color: 'cyan',
    description: 'Handle wholesale operations'
  },
  { 
    id: 'shopkeeper', 
    name: 'Shopkeeper', 
    icon: Store, 
    color: 'pink',
    description: 'Retail point management'
  }
];

export const STAGES = [
  { id: 'harvest', name: 'Harvest', role: 'farmer', order: 1 },
  { id: 'processing', name: 'Processing & Packaging', role: 'processor', order: 2 },
  { id: 'distribution', name: 'Distribution', role: 'distributor', order: 3 },
  { id: 'supplier', name: 'Wholesale Supply', role: 'supplier', order: 4 },
  { id: 'retail', name: 'Retail Store', role: 'shopkeeper', order: 5 }
];

export const STAGE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  VERIFIED: 'verified'
};

export const FORM_FIELDS = {
  HARVEST: [
    { name: 'RnR_farmer_id', label: 'Farmer ID (RnR)', type: 'text', required: true },
    { name: 'product_name', label: 'Product Name', type: 'text', required: true },
    { name: 'batch_id', label: 'Batch ID', type: 'text', required: true },
    { name: 'harvest_date', label: 'Harvest Date', type: 'date', required: true },
    { name: 'gps_coordinates', label: 'GPS Coordinates', type: 'text', required: true },
    { name: 'fertilizer', label: 'Fertilizer Used', type: 'text', required: false },
    { name: 'organic_status', label: 'Organic Status', type: 'checkbox', required: false }
  ],
  PROCESSING: [
    { name: 'batch_id', label: 'Batch ID', type: 'text', required: true },
    { name: 'processing_gps', label: 'Processing GPS', type: 'text', required: true },
    { name: 'grinding_facility_name', label: 'Grinding Facility Name', type: 'text', required: true },
    { name: 'lab_report_ipfs_hash', label: 'Lab Report IPFS Hash', type: 'text', required: true },
    { name: 'moisture_content', label: 'Moisture Content (%)', type: 'number', required: true },
    { name: 'curcumin_content', label: 'Curcumin Content (%)', type: 'number', required: true },
    { name: 'heavy_metals', label: 'Heavy Metals Test Result', type: 'text', required: true },
    { name: 'physical_properties', label: 'Physical Properties', type: 'text', required: false },
    { name: 'packaging_date', label: 'Packaging Date', type: 'date', required: true },
    { name: 'packaging_unit', label: 'Packaging Unit', type: 'text', required: true },
    { name: 'batch_coding', label: 'Batch Coding', type: 'text', required: true },
    { name: 'expiry_date', label: 'Expiry Date', type: 'date', required: true }
  ],
  DISTRIBUTOR: [
    { name: 'distributor_id', label: 'Distributor ID', type: 'text', required: true },
    { name: 'packet_id', label: 'Packet ID', type: 'text', required: true },
    { name: 'gps_coordinates', label: 'GPS Coordinates', type: 'text', required: true },
    { name: 'box_code', label: 'Box Code', type: 'text', required: true },
    { name: 'dispatch_date', label: 'Dispatch Date', type: 'date', required: true },
    { name: 'tracking_number', label: 'Tracking Number', type: 'text', required: true }
  ],
  SUPPLIER: [
    { name: 'supplier_id', label: 'Supplier ID', type: 'text', required: true },
    { name: 'packet_id', label: 'Packet ID', type: 'text', required: true },
    { name: 'gps_coordinates', label: 'GPS Coordinates', type: 'text', required: true },
    { name: 'receipt_date', label: 'Receipt Date', type: 'date', required: true },
    { name: 'shopkeeper_list', label: 'Shopkeeper List (comma separated)', type: 'textarea', required: false }
  ],
  SHOPKEEPER: [
    { name: 'shopkeeper_id', label: 'Shopkeeper ID', type: 'text', required: true },
    { name: 'packet_id', label: 'Packet ID', type: 'text', required: true },
    { name: 'gps_coordinates', label: 'GPS Coordinates', type: 'text', required: true },
    { name: 'date_received', label: 'Date Received', type: 'date', required: true },
    { name: 'shelf_life_expiry', label: 'Shelf Life Expiry', type: 'date', required: true }
  ]
};