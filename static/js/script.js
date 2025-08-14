document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const scannerContainer = document.getElementById('scanner-container');
    const resultContainer = document.getElementById('result-container');
    const qrReaderStatus = document.getElementById('qr-reader-status');
    const rescanButton = document.getElementById('rescan-button');

    // Initialize the QR Code scanner library
    const html5QrCode = new Html5Qrcode("qr-reader");

    const startScanner = () => {
        // Show the scanner UI and hide the result UI
        scannerContainer.classList.remove('hidden');
        resultContainer.classList.add('hidden');
        qrReaderStatus.textContent = 'Requesting camera access...';

        const qrCodeSuccessCallback = (decodedText, decodedResult) => {
            // This function is called when a QR code is successfully scanned
            console.log(`Scan result: ${decodedText}`);
            
            // Stop scanning to free up the camera and prevent multiple scans
            html5QrCode.stop().then(() => {
                console.log("QR Code scanning stopped.");
                processQRData(decodedText);
            }).catch(err => {
                console.error("Failed to stop QR Code scanning.", err);
                // Still try to process the data even if stopping fails
                processQRData(decodedText);
            });
        };

        // Configuration for the scanner
        const config = { 
            fps: 10, // Scan frames per second
            qrbox: { width: 250, height: 250 } // Defines the scan box size
        };

        // Start scanning using the back camera ("environment")
        html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
            .then(() => {
                 qrReaderStatus.textContent = 'Point camera at a LifeTag QR Code';
            })
            .catch(err => {
                // Handle errors, like user denying camera access
                console.error(`Unable to start scanning, error: ${err}`);
                qrReaderStatus.textContent = 'Error: Could not access camera. Please grant permission and refresh.';
                qrReaderStatus.style.color = 'red';
            });
    };

    const processQRData = (qrText) => {
        try {
            // The QR text is a Python dict string, not JSON.
            // This regex-based replacement safely converts it to a valid JSON string
            // by replacing single quotes with double quotes for keys and string values.
            const jsonString = qrText.replace(/'/g, '"');
            
            const data = JSON.parse(jsonString);

            // Check if the expected 'public' data exists
            if (data && data.public) {
                displayResults(data.public);
            } else {
                throw new Error("QR code does not contain the required 'public' data field.");
            }

        } catch (error) {
            console.error("Error parsing QR data:", error);
            alert(`Could not read this QR Code. It might not be a valid LifeTag.\n\nError: ${error.message}`);
            startScanner(); // Go back to scanning if data is invalid
        }
    };

    const displayResults = (data) => {
        // Populate the result fields with data from the QR code
        document.getElementById('full_name').textContent = data.full_name || 'N/A';
        document.getElementById('address').textContent = data.address || 'N/A';
        document.getElementById('emergency_contact_name').textContent = data.emergency_contact_name || 'N/A';
        document.getElementById('emergency_contact_relation').textContent = data.emergency_contact_relation || 'N/A';
        document.getElementById('emergency_contact_address').textContent = data.emergency_contact_address || 'N/A';
        
        const callButton = document.getElementById('call-button');
        if (data.emergency_contact_mobile) {
            // Create the 'tel:' link for the call button
            callButton.href = `tel:${data.emergency_contact_mobile}`;
            callButton.style.display = 'inline-flex';
        } else {
            callButton.style.display = 'none';
        }

        // Hide scanner UI and show the results UI
        scannerContainer.classList.add('hidden');
        resultContainer.classList.remove('hidden');
    };

    // Add event listener to the "Scan Another Tag" button
    rescanButton.addEventListener('click', () => {
        startScanner();
    });

    // Start the scanner automatically when the page loads
    startScanner();
});