// WebXR AR implementation for Android devices
async function loadWebXRAr(container, foodData) {
    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.error('Three.js not loaded');
        return;
    }
    
    try {
        // Check if WebXR is supported
        if (!('xr' in navigator) || !('isSessionSupported' in navigator.xr)) {
            throw new Error('WebXR not supported');
        }
        
        // Check if AR session is supported
        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        if (!supported) {
            throw new Error('WebXR AR not supported');
        }
        
        // Create a canvas element for rendering
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        container.appendChild(canvas);
        
        // Initialize Three.js for 3D rendering
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        
        // Load the 3D model
        let model;
        try {
            const loader = new THREE.GLTFLoader();
            const gltf = await loader.loadAsync(foodData.model);
            model = gltf.scene;
            
            // Scale the model to real-world size (12-inch diameter)
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3()).length();
            const targetSize = 0.3048; // 12 inches in meters
            const scale = targetSize / size;
            model.scale.set(scale, scale, scale);
            
            // Center the model
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center.multiplyScalar(scale));
            
            // Add shadow to the model
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            scene.add(model);
        } catch (error) {
            console.error('Error loading 3D model:', error);
            // Fallback to image if model fails to load
            const textureLoader = new THREE.TextureLoader();
            const texture = await textureLoader.loadAsync(foodData.fallback);
            
            const geometry = new THREE.PlaneGeometry(0.3048, 0.3048); // 12 inches in meters
            const material = new THREE.MeshBasicMaterial({ map: texture });
            model = new THREE.Mesh(geometry, material);
            model.rotation.x = -Math.PI / 2; // Rotate to lie flat
            
            scene.add(model);
        }
        
        // Create a shadow plane
        const shadowPlane = new THREE.PlaneGeometry(0.5, 0.5);
        const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
        const shadow = new THREE.Mesh(shadowPlane, shadowMaterial);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = -0.001; // Slightly below the model
        shadow.receiveShadow = true;
        shadow.visible = false; // Hide until model is placed
        scene.add(shadow);
        
        // Initially hide the model until it's placed
        model.visible = false;
        
        // Request an XR session
        const session = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: container }
        });
        
        // Set up the XR session
        session.updateRenderState({ baseLayer: new XRWebGLLayer(session, renderer.gl) });
        
        // Set up hit testing for surface detection
        const viewerSpace = await session.requestReferenceSpace('viewer');
        const hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
        
        // Set up a reference space for the AR content
        const localSpace = await session.requestReferenceSpace('local');
        
        // Variables for interaction
        let placed = false;
        let hitTestResult = null;
        let modelAnchor = null;
        
        // Touch variables for rotation and scaling
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartDistance = 0;
        let initialRotation = 0;
        let initialScale = 1;
        let isRotating = false;
        let isScaling = false;
        
        // Handle touch events for interaction
        canvas.addEventListener('touchstart', (event) => {
            if (event.touches.length === 1) {
                // Single touch for rotation
                touchStartX = event.touches[0].clientX;
                touchStartY = event.touches[0].clientY;
                isRotating = true;
                if (model) {
                    initialRotation = model.rotation.y;
                }
            } else if (event.touches.length === 2) {
                // Two touches for scaling
                isRotating = false;
                isScaling = true;
                touchStartDistance = Math.hypot(
                    event.touches[0].clientX - event.touches[1].clientX,
                    event.touches[0].clientY - event.touches[1].clientY
                );
                if (model) {
                    initialScale = model.scale.x;
                }
            }
        });
        
        canvas.addEventListener('touchmove', (event) => {
            if (isRotating && model && placed) {
                // Rotate model with single touch
                const touchX = event.touches[0].clientX;
                const deltaX = touchX - touchStartX;
                model.rotation.y = initialRotation + deltaX * 0.01;
            } else if (isScaling && model && placed) {
                // Scale model with pinch gesture
                const distance = Math.hypot(
                    event.touches[0].clientX - event.touches[1].clientX,
                    event.touches[0].clientY - event.touches[1].clientY
                );
                const scale = initialScale * (distance / touchStartDistance);
                
                // Limit scale between 50% and 150%
                const clampedScale = Math.max(0.5, Math.min(1.5, scale));
                model.scale.set(clampedScale, clampedScale, clampedScale);
            }
        });
        
        canvas.addEventListener('touchend', () => {
            isRotating = false;
            isScaling = false;
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Animation loop
        const onXRFrame = (time, frame) => {
            session.requestAnimationFrame(onXRFrame);
            
            // Get the pose of the device
            const pose = frame.getViewerPose(localSpace);
            
            if (pose) {
                // Update camera position
                const view = pose.views[0];
                camera.matrix.fromArray(view.transform.matrix);
                camera.projectionMatrix.fromArray(view.projectionMatrix);
                camera.updateMatrixWorld(true);
                
                // Perform hit test if model not yet placed
                if (!placed) {
                    const hitTestResults = frame.getHitTestResults(hitTestSource);
                    
                    if (hitTestResults.length > 0) {
                        hitTestResult = hitTestResults[0];
                        
                        // Create an anchor at the hit test position
                        if (!modelAnchor) {
                            modelAnchor = new XRAnchorOffset(hitTestResult.createAnchor());
                            
                            // Position the model at the anchor
                            if (model) {
                                const position = hitTestResult.getPose(localSpace).transform.position;
                                model.position.set(position.x, position.y, position.z);
                                model.visible = true;
                                
                                // Position the shadow at the same location
                                shadow.position.set(position.x, position.y - 0.001, position.z);
                                shadow.visible = true;
                                
                                placed = true;
                            }
                        }
                    }
                }
                
                // Render the scene
                renderer.render(scene, camera);
            }
        };
        
        // Start the animation loop
        session.requestAnimationFrame(onXRFrame);
        
        // Handle session end
        session.addEventListener('end', () => {
            // Clean up resources
            if (hitTestSource) {
                hitTestSource.cancel();
            }
            
            // Remove the canvas
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        });
        
    } catch (error) {
        console.error('Error initializing WebXR AR:', error);
        
        // Fall back to 3D viewer if WebXR fails
        container.classList.add('hidden');
        const fallbackContainer = document.getElementById('fallback-container');
        fallbackContainer.classList.remove('hidden');
        loadFallbackViewer(fallbackContainer, foodData);
    }
}