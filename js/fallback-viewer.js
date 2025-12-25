// Fallback 3D viewer for unsupported devices
function loadFallbackViewer(container, foodData) {
    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.error('Three.js not loaded');
        return;
    }
    
    // Create a canvas element for rendering
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);
    
    // Initialize Three.js for 3D rendering
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 0.5;
    
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Load the 3D model or fallback image
    let model;
    
    // Try to load the 3D model first
    const loader = new THREE.GLTFLoader();
    loader.load(
        foodData.model,
        (gltf) => {
            model = gltf.scene;
            
            // Scale the model to a reasonable size for the viewer
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3()).length();
            const targetSize = 0.3;
            const scale = targetSize / size;
            model.scale.set(scale, scale, scale);
            
            // Center the model
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center.multiplyScalar(scale));
            
            scene.add(model);
        },
        undefined,
        (error) => {
            console.error('Error loading 3D model:', error);
            
            // Fallback to image if model fails to load
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(foodData.fallback, (texture) => {
                const geometry = new THREE.PlaneGeometry(0.3, 0.3);
                const material = new THREE.MeshBasicMaterial({ map: texture });
                model = new THREE.Mesh(geometry, material);
                scene.add(model);
            });
        }
    );
    
    // Add orbit controls for interaction
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.3;
    controls.maxDistance = 1;
    controls.maxPolarAngle = Math.PI / 2;
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Update controls
        controls.update();
        
        // Render the scene
        renderer.render(scene, camera);
    }
    
    animate();
}