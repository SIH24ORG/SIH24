import cap from 'cap';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios'; // Import axios

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvWriter = createObjectCsvWriter({
    path: path.join(__dirname, '../logs/capture.csv'),
    header: [
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'srcIP', title: 'Source IP' },
        { id: 'srcPort', title: 'Source Port' },
        { id: 'destIP', title: 'Destination IP' },
        { id: 'destPort', title: 'Destination Port' },
        { id: 'protocol', title: 'Protocol' },
        { id: 'length', title: 'Length' },
        { id: 'httpMethod', title: 'HTTP Method' },
        { id: 'httpPath', title: 'HTTP Path' },
        { id: 'payload', title: 'Payload (Hex)' },
        { id: 'truncated', title: 'Truncated' },
        { id: 'dstPort', title: 'Dst Port' },
        { id: 'flowPktsPerSec', title: 'Flow Pkts/s' },
        { id: 'fwdHeaderLen', title: 'Fwd Header Len' },
        { id: 'bwdHeaderLen', title: 'Bwd Header Len' },
        { id: 'fwdPktsPerSec', title: 'Fwd Pkts/s' },
        { id: 'bwdPktsPerSec', title: 'Bwd Pkts/s' },
        { id: 'initFwdWinByts', title: 'Init Fwd Win Byts' },
        { id: 'initBwdWinByts', title: 'Init Bwd Win Byts' },
        { id: 'fwdActDataPkts', title: 'Fwd Act Data Pkts' },
        { id: 'fwdSegSizeMin', title: 'Fwd Seg Size Min' },
    ],
    append: true
});

const findDevice = () => {
    const devices = cap.deviceList();
    console.log('Available Devices:', devices);
    const selectedDevice = devices.find(device => device.name.includes('10DD9138'));

    if (selectedDevice) {
        console.log(`Selected Device: ${selectedDevice.name}`);
        return selectedDevice.name;
    }

    throw new Error('No suitable network device found.');
};

const extractPacketDetails = (buffer) => {
    const srcIP = buffer.slice(26, 30).join('.');
    const destIP = buffer.slice(30, 34).join('.');
    const srcPort = buffer.readUInt16BE(34);
    const destPort = buffer.readUInt16BE(36);
    const protocol = buffer[23] === 6 ? 'TCP' : buffer[23] === 17 ? 'UDP' : 'Other';
    const seqNum = protocol === 'TCP' ? buffer.readUInt32BE(42) : null;
    const ackNum = protocol === 'TCP' ? buffer.readUInt32BE(46) : null;
    const flags = protocol === 'TCP' ? buffer.slice(47, 48).toString('hex') : null;
    const windowSize = protocol === 'TCP' ? buffer.readUInt16BE(48) : null;
    const checksum = protocol === 'TCP' || protocol === 'UDP' ? buffer.slice(50, 52).toString('hex') : null;

    return {
        srcIP,
        srcPort,
        destIP,
        destPort,
        protocol,
        seqNum,
        ackNum,
        flags,
        windowSize,
        checksum
    };
};

const extractAdditionalDetails = (buffer) => {
    // Dummy values for the new features; in practice, you would extract these from the packet data
    const dstPort = buffer.readUInt16BE(36);
    const flowPktsPerSec = 0; // This would typically be computed over time
    const fwdHeaderLen = buffer.readUInt8(14); // Example offset, adjust as needed
    const bwdHeaderLen = buffer.readUInt8(16); // Example offset, adjust as needed
    const fwdPktsPerSec = 0; // This would typically be computed over time
    const bwdPktsPerSec = 0; // This would typically be computed over time
    const initFwdWinByts = buffer.readUInt16BE(48);
    const initBwdWinByts = buffer.readUInt16BE(50); // Example offset, adjust as needed
    const fwdActDataPkts = 0; // This would typically be computed over time
    const fwdSegSizeMin = buffer.readUInt16BE(54); // Example offset, adjust as needed

    return {
        dstPort,
        flowPktsPerSec,
        fwdHeaderLen,
        bwdHeaderLen,
        fwdPktsPerSec,
        bwdPktsPerSec,
        initFwdWinByts,
        initBwdWinByts,
        fwdActDataPkts,
        fwdSegSizeMin
    };
};

const sendPacketToServer = async (packetData) => {
    try {
        const response = await axios.post('http://127.0.0.1:5000/predict', packetData);
        console.log('Server response:', response.data);
    } catch (error) {
        console.error('Error sending packet to server:', error);
    }
};

export const startPacketCapture = () => {
    const c = new cap.Cap();
    const device = findDevice();

    // Filter for HTTP traffic (port 80)
    const filter = ''; 
    const bufSize = 10 * 1024 * 1024;
    const buffer = Buffer.alloc(65535);

    c.open(device, filter, bufSize, buffer);
    c.setMinBytes && c.setMinBytes(0);

    c.on('packet', async (nbytes, truncated) => {
        //console.log(`Packet captured (${nbytes} bytes)`);

        try {
            const packetDetails = extractPacketDetails(buffer);
            const additionalDetails = extractAdditionalDetails(buffer);

            const record = {
                destPort: packetDetails.destPort,
                flowPktsPerSec: additionalDetails.flowPktsPerSec,
                fwdHeaderLen: additionalDetails.fwdHeaderLen,
                bwdHeaderLen: additionalDetails.bwdHeaderLen,
                fwdPktsPerSec: additionalDetails.fwdPktsPerSec,
                bwdPktsPerSec: additionalDetails.bwdPktsPerSec,
                initFwdWinByts: additionalDetails.initFwdWinByts,
                initBwdWinByts: additionalDetails.initBwdWinByts,
                fwdActDataPkts: additionalDetails.fwdActDataPkts,
                fwdSegSizeMin: additionalDetails.fwdSegSizeMin
            };

            // Send packet details to Flask server
            await sendPacketToServer(record);

            await csvWriter.writeRecords([record]);
            //console.log('Packet data logged and sent to server:', record);
        } catch (err) {
            console.error('Error processing packet:', err);
        }
    });

    console.log('Packet capture started');
};
