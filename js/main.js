document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const viewInArButton = document.getElementById('view-in-ar');
    const arContainer = document.getElementById('ar-container');
    const fallbackContainer = document.getElementById('fallback-container');
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.textContent = 'Loading AR experience...';
    loadingIndicator.style.display = 'none';
    document.querySelector('.food-card').appendChild(loadingIndicator);
    
    // Load food data
    let foodData;
    fetch('assets/pizza/data.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            foodData = data;
            console.log('Food data loaded:', foodData);
        })
        .catch(error => {
            console.error('Error loading food data:', error);
            showError('Error loading menu data. Please refresh the page.');
        });
    
    // Show error message
    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        document.querySelector('.food-card').appendChild(errorElement);
    }
    
    // Detect device capabilities
    function detectDeviceCapabilities() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);
        const isWebXRSupported = 'xr' in navigator && 'isSessionSupported' in navigator.xr;
        
        console.log('Device capabilities:', {
            isIOS,
            isAndroid,
            isWebXRSupported,
            userAgent: navigator.userAgent
        });
        
        return {
            isIOS,
            isAndroid,
            isWebXRSupported
        };
    }
    
    // Handle AR button click
    viewInArButton.addEventListener('click', async () => {
        if (!foodData) {
            showError('Menu data not loaded yet. Please wait and try again.');
            return;
        }
        
        const { isIOS, isAndroid, isWebXRSupported } = detectDeviceCapabilities();
        
        // Show loading indicator
        loadingIndicator.style.display = 'block';
        viewInArButton.disabled = true;
        
        try {
            // Hide the main content
            document.querySelector('.food-card').style.display = 'none';
            
            if (isIOS) {
                // Use AR Quick Look for iOS
                console.log('Loading AR Quick Look for iOS');
                loadARQuickLook(foodData);
            } else if (isAndroid && isWebXRSupported) {
                // Use WebXR for Android
                console.log('Loading WebXR AR for Android');
                arContainer.classList.remove('hidden');
                await loadWebXRAr(arContainer, foodData);
            } else {
                // Use 3D fallback for unsupported devices
                console.log('Loading fallback viewer');
                fallbackContainer.classList.remove('hidden');
                loadFallbackViewer(fallbackContainer, foodData);
            }
        } catch (error) {
            console.error('Error loading AR experience:', error);
            showError(`Error: ${error.message || 'Failed to load AR experience'}`);
            exitARView();
        } finally {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
            viewInArButton.disabled = false;
        }
    });
    
    // Function to exit AR view
    function exitARView() {
        arContainer.classList.add('hidden');
        fallbackContainer.classList.add('hidden');
        document.querySelector('.food-card').style.display = 'block';
        
        // Clean up any existing AR content
        while (arContainer.firstChild) {
            arContainer.removeChild(arContainer.firstChild);
        }
        while (fallbackContainer.firstChild) {
            fallbackContainer.removeChild(fallbackContainer.firstChild);
        }
    }
    
    // Add event listener for exiting AR view (e.g., back button)
    window.addEventListener('popstate', (event) => {
        if (!arContainer.classList.contains('hidden') || !fallbackContainer.classList.contains('hidden')) {
            exitARView();
        }
    });
    
    // Add exit button to AR containers
    function addExitButton(container) {
        const exitButton = document.createElement('button');
        exitButton.textContent = 'Exit AR';
        exitButton.className = 'exit-button';
        exitButton.style.position = 'absolute';
        exitButton.style.top = '20px';
        exitButton.style.right = '20px';
        exitButton.style.zIndex = '1000';
        exitButton.style.padding = '8px 16px';
        exitButton.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        exitButton.style.border = 'none';
        exitButton.style.borderRadius = '4px';
        exitButton.style.cursor = 'pointer';
        exitButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        
        exitButton.addEventListener('click', exitARView);
        
        container.appendChild(exitButton);
    }
    
    // Add exit buttons to containers
    addExitButton(arContainer);
    addExitButton(fallbackContainer);
});