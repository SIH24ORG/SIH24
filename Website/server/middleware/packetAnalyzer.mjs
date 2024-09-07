import cap from 'cap';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import { fileURLToPath } from 'url';

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
        { id: 'seqNum', title: 'Sequence Number' },
        { id: 'ackNum', title: 'Acknowledgment Number' },
        { id: 'flags', title: 'Flags' },
        { id: 'windowSize', title: 'Window Size' },
        { id: 'checksum', title: 'Checksum' },
        { id: 'payload', title: 'Payload (Hex)' },
        { id: 'truncated', title: 'Truncated' },
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

export const analyzeTraffic = () => {
    try {
        const packets = []; 
        const c = new cap.Cap();
        const device = findDevice();

        const filter = ''; 
        const bufSize = 10 * 1024 * 1024; 
        const buffer = Buffer.alloc(65535); 

        const linkType = c.open(device, filter, bufSize, buffer);
        c.setMinBytes && c.setMinBytes(0);

        console.log(`Listening on device: ${device}`);
        console.log(`Link type: ${linkType}`);

        c.on('packet', async (nbytes, truncated) => {
            console.log(`Packet received (${nbytes} bytes)`);

            try {
                const packetDetails = extractPacketDetails(buffer);

                const record = {
                    timestamp: new Date().toISOString(),
                    srcIP: packetDetails.srcIP,
                    srcPort: packetDetails.srcPort,
                    destIP: packetDetails.destIP,
                    destPort: packetDetails.destPort,
                    protocol: packetDetails.protocol,
                    length: nbytes,
                    seqNum: packetDetails.seqNum,
                    ackNum: packetDetails.ackNum,
                    flags: packetDetails.flags,
                    windowSize: packetDetails.windowSize,
                    checksum: packetDetails.checksum,
                    payload: buffer.toString('hex', 0, nbytes).substring(0, 60) + '...',
                    truncated: truncated ? 'Yes' : 'No',
                };

                packets.push(record);

                console.log('Packet Details:', record);

                await csvWriter.writeRecords([record]);

            } catch (err) {
                console.error('Error parsing packet:', err);
            }
        });

    } catch (error) {
        console.error('Error initializing packet capture:', error);
    }
};
