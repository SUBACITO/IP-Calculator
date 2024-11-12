document.getElementById('ip-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const ipInput = document.getElementById('ip').value;
    const resultDiv = document.getElementById('result');

    const [ip, cidr] = ipInput.split('/');
    if (!ip || !cidr) {
        resultDiv.innerHTML = '<p>Please enter a valid IP address with CIDR (e.g. 192.168.1.0/24).</p>';
        return;
    }

    // Perform calculations
    const networkAddress = getNetworkAddress(ip, parseInt(cidr));
    const subnetMask = getSubnetMask(parseInt(cidr));
    const broadcastAddress = getBroadcastAddress(networkAddress, parseInt(cidr));
    const firstHost = getFirstHost(networkAddress);
    const lastHost = getLastHost(broadcastAddress);


    // Append result to history
    addToHistory({
        networkAddress,
        subnetMask,
        broadcastAddress,
        firstHost,
        lastHost
    });
});

// Function to add calculation to history
function addToHistory(data) {
    const historyContent = document.getElementById('history-content');
    const entryDiv = document.createElement('div');
    entryDiv.classList.add('history-entry');
    const currentTime = new Date().toLocaleString();

    // Create the table layout similar to the Solana stats table
    entryDiv.innerHTML = `
        <table class="history-table">
            <tr><td class="history-label">${currentTime}</td><td class=""></td></tr>
            <tr><td class="history-label">Network</td><td class="history-value">${data.networkAddress}</td></tr>
            <tr><td class="history-label">Mask</td><td class="history-value">${data.subnetMask}</td></tr>
            <tr><td class="history-label">Broadcast</td><td class="history-value">${data.broadcastAddress}</td></tr>
            <tr><td class="history-label">First Host</td><td class="history-value">${data.firstHost}</td></tr>
            <tr><td class="history-label">Last Host</td><td class="history-value">${data.lastHost}</td></tr>
        </table>
    `;

    historyContent.prepend(entryDiv); // Add new history entries at the top
}
function getSubnetMask(cidr) {
    // Create a 32-bit binary mask by setting `cidr` bits to 1, followed by 0s
    const maskBinary = '1'.repeat(cidr).padEnd(32, '0');
    // Convert the binary mask into dotted decimal notation
    return [...Array(4)].map((_, i) => parseInt(maskBinary.slice(i * 8, (i + 1) * 8), 2)).join('.');
}

function getNetworkAddress(ip, cidr) {
    const ipBinary = ipToBinary(ip);
    const networkBinary = ipBinary.slice(0, cidr) + '0'.repeat(32 - cidr);
    return binaryToIp(networkBinary);
}

function getBroadcastAddress(networkAddress, cidr) {
    const networkBinary = ipToBinary(networkAddress);
    const broadcastBinary = networkBinary.slice(0, cidr) + '1'.repeat(32 - cidr);
    return binaryToIp(broadcastBinary);
}

function getFirstHost(networkAddress) {
    const hostBinary = ipToBinary(networkAddress).slice(0, 31) + '1';
    return binaryToIp(hostBinary);
}

function getLastHost(broadcastAddress) {
    const hostBinary = ipToBinary(broadcastAddress).slice(0, 31) + '0';
    return binaryToIp(hostBinary);
}

function ipToBinary(ip) {
    return ip.split('.').map(octet => parseInt(octet).toString(2).padStart(8, '0')).join('');
}

function binaryToIp(binary) {
    return [...Array(4)].map((_, i) => parseInt(binary.slice(i * 8, (i + 1) * 8), 2)).join('.');
}
