


document.getElementById('applyButton').addEventListener('click', function () {
    const subnetCount = parseInt(document.getElementById('subnets').value);
    const subnetContainer = document.getElementById('subnet-inputs-container');
    const calculateButton = document.getElementById('calculateButton');

    subnetContainer.innerHTML = '';

    if (isNaN(subnetCount) || subnetCount <= 0) {
        alert('Please enter a valid number of subnets.');
        return;
    }


    for (let i = 1; i <= subnetCount; i++) {
        const subnetGroup = document.createElement('div');
        subnetGroup.classList.add('subnet-input-group');
        subnetGroup.innerHTML = `
            <label for="subnetName${i}">Subnet Name ${i}:</label>
            <input type="text" id="subnetName${i}" value="${i}" required>
            <label for="hosts${i}">Number of Hosts for Subnet ${i}:</label>
            <input type="number" id="hosts${i}" placeholder="e.g. 30" required min="1">
        `;
        subnetContainer.appendChild(subnetGroup);
        // // Collect the data in an array to sort later
        // const subnetName = document.getElementById(`subnetName${i}`).value;
        // const hostsPerSubnet = parseInt(document.getElementById(`hosts${i}`).value);
        // subnetData.push({ name: subnetName, hosts: hostsPerSubnet });
    }

    // subnetData.sort((a, b) => b.hosts - a.hosts);
    // console.log(subnetData)

    calculateButton.style.display = 'inline-block';
});

document.getElementById('vlsm-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const ipInput = document.getElementById('ip').value;
    const subnetCount = parseInt(document.getElementById('subnets').value);
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';

    const [ip, cidr] = ipInput.split('/');
    if (!ip || !cidr) {
        resultDiv.innerHTML = '<p>Please enter a valid IP address with CIDR (e.g. 192.168.1.0/24).</p>';
        return;
    }

    let initialNetworkAddress = ip.split('.').map(Number); // Starting network address as an array of numbers
    const subnets = [];

    // Collect subnet data first
    for (let i = 1; i <= subnetCount; i++) {
        const subnetName = document.getElementById(`subnetName${i}`).value;
        const hostsPerSubnet = parseInt(document.getElementById(`hosts${i}`).value);

        console.log(`Subnet ${i}: Name = ${subnetName}, Hosts = ${hostsPerSubnet}`); // Debugging line

        if (!subnetName || isNaN(hostsPerSubnet)) {
            console.log(`Invalid input for subnet ${i}`); // Debugging invalid data
            continue;
        }

        // Determine the CIDR that can contain the required number of hosts
        const requiredCidr = calculateRequiredCidr(hostsPerSubnet);
        console.log(`Required CIDR for ${hostsPerSubnet} hosts: ${requiredCidr}`); // Debugging line

        subnets.push({
            subnetName,
            hostsPerSubnet,
            requiredCidr
        });
    }

    // Sort subnets by hosts in descending order before calculation
    subnets.sort((a, b) => b.hostsPerSubnet - a.hostsPerSubnet);

    console.log("Sorted subnets:", subnets); // Debugging line

    // Calculate subnet data after sorting
    subnets.forEach(subnet => {
        // Adjust the starting address to ensure it aligns with the required CIDR
        initialNetworkAddress = adjustStartingAddress(initialNetworkAddress, subnet.requiredCidr);

        // Calculate subnet data with the adjusted starting network address
        const subnetData = calculateSubnetData(initialNetworkAddress, subnet.hostsPerSubnet);

        if (!subnetData) {
            console.log(`Error in calculating subnet data for ${subnet.subnetName}`); // Debugging line
        }

        subnet.networkData = subnetData;
        // console.log(`Subnet ${subnet.subnetName} Data:`, subnetData); // Debugging line

        // Update the network address to the next network based on the subnet size
        initialNetworkAddress = subnetData.nextNetwork.split('.').map(Number);
    });

    console.log(subnets);
    // Display results after all calculations
    displayResults(subnets, resultDiv);
});



function calculateRequiredCidr(hosts) {
    // Calculate the minimum CIDR that can accommodate the number of hosts
    const bitsNeeded = Math.ceil(Math.log2(hosts + 2)); // +2 for network and broadcast addresses
    return 32 - bitsNeeded;
}

function adjustStartingAddress(networkAddress, newCidr) {
    const mask = (0xFFFFFFFF << (32 - newCidr)) >>> 0;

    // Convert the IP address to a single integer
    let ipInteger =
        (networkAddress[0] << 24) |
        (networkAddress[1] << 16) |
        (networkAddress[2] << 8) |
        networkAddress[3];

    // Align to the subnet boundary by zeroing out bits outside the new CIDR
    ipInteger = (ipInteger >>> (32 - newCidr)) << (32 - newCidr);

    // Convert back to dotted decimal notation
    return [
        (ipInteger >>> 24) & 0xFF,
        (ipInteger >>> 16) & 0xFF,
        (ipInteger >>> 8) & 0xFF,
        ipInteger & 0xFF
    ];
}


function calculateSubnetData(networkAddress, hostsPerSubnet) {
    const requiredBits = Math.ceil(Math.log2(hostsPerSubnet + 2));
    const newCidr = 32 - requiredBits;
    const subnetSize = Math.pow(2, 32 - newCidr);

    const subnetMask = calculateSubnetMask(newCidr);
    const broadcastAddress = calculateBroadcastAddress(networkAddress, subnetSize);
    const availableHosts = subnetSize - 2;

    // Calculate the next network address based on the current subnet size
    let nextNetwork = incrementNetworkAddress(networkAddress, subnetSize);

    return {
        networkAddress: networkAddress.join('.'),
        subnetMask,
        broadcastAddress: broadcastAddress.join('.'),
        availableHosts,
        unusedHosts: availableHosts - hostsPerSubnet,
        nextNetwork: nextNetwork.join('.'),
        slash: `/${newCidr}`,
        usableRange: `${incrementNetworkAddress(networkAddress, 1).join('.')} - ${incrementNetworkAddress(broadcastAddress, -1).join('.')}`
    };
}

function incrementNetworkAddress(networkAddress, increment) {
    let carry = increment;
    let nextNetwork = [...networkAddress];

    for (let i = 3; i >= 0; i--) {
        nextNetwork[i] += carry;
        if (nextNetwork[i] > 255) {
            carry = Math.floor(nextNetwork[i] / 256);
            nextNetwork[i] %= 256;
        } else {
            carry = 0;
        }
    }

    return nextNetwork;
}

function calculateSubnetMask(cidr) {
    const mask = (0xFFFFFFFF << (32 - cidr)) >>> 0;
    return [(mask >>> 24) & 0xFF, (mask >>> 16) & 0xFF, (mask >>> 8) & 0xFF, mask & 0xFF].join('.');
}

function calculateBroadcastAddress(networkAddress, subnetSize) {
    const broadcastParts = [...networkAddress];
    let carry = subnetSize - 1;
    for (let i = 3; i >= 0; i--) {
        broadcastParts[i] += carry;
        if (broadcastParts[i] > 255) {
            carry = Math.floor(broadcastParts[i] / 256);
            broadcastParts[i] %= 256;
        } else {
            carry = 0;
        }
    }
    return broadcastParts;
}

function displayResults(subnets, resultDiv) {
    let resultHtml = '';
    
    resultHtml += `
        <table class="history-table">
            <tr>
                <th class="history-label">Subnet Name</th>
                <th class="history-label">Hosts Available</th>
                <th class="history-label">Unused Hosts</th>
                <th class="history-label">Network Address</th>
                <th class="history-label">Slash</th>
                <th class="history-label">Mask</th>
                <th class="history-label">Usable Range</th>
                <th class="history-label">Broadcast</th>
                <th class="history-label">Time</th>
            </tr>
    `;

    subnets.forEach(subnet => {
        const currentTime = new Date().toLocaleString();
        resultHtml += `
            <tr>
                <td class="history-value">${subnet.subnetName}</td>
                <td class="history-value">${subnet.networkData.availableHosts}</td>
                <td class="history-value">${subnet.networkData.unusedHosts}</td>
                <td class="history-value">${subnet.networkData.networkAddress}</td>
                <td class="history-value">${subnet.networkData.slash}</td>
                <td class="history-value">${subnet.networkData.subnetMask}</td>
                <td class="history-value">${subnet.networkData.usableRange}</td>
                <td class="history-value">${subnet.networkData.broadcastAddress}</td>
                <td class="history-value">${currentTime}</td>
            </tr>
        `;
    });

    resultHtml += '</table>';
    resultDiv.innerHTML = resultHtml;
}


