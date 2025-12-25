// AR Quick Look implementation for iOS devices
function loadARQuickLook(foodData) {
    console.log('Preparing AR Quick Look experience');
    
    // Create a container for the AR Quick Look link
    const container = document.createElement('div');
    container.className = 'ar-quick-look-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.zIndex = '1000';
    
    // Create a title
    const title = document.createElement('h2');
    title.textContent = 'View in AR';
    title.style.color = 'white';
    title.style.marginBottom = '20px';
    container.appendChild(title);
    
    // Create a link element for AR Quick Look
    const link = document.createElement('a');
    link.setAttribute('rel', 'ar');
    link.setAttribute('href', foodData.model);
    link.setAttribute('title', foodData.name);
    link.setAttribute('ios', '');
    
    // Set the scale of the model (12 inches)
    const scale = 0.3048; // 12 inches in meters
    link.setAttribute('scale', `${scale} ${scale} ${scale}`);
    
    // Create a thumbnail image
    const img = document.createElement('img');
    img.setAttribute('src', foodData.fallback);
    img.setAttribute('alt', foodData.name);
    img.style.width = '200px';
    img.style.height = '200px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '10px';
    img.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    link.appendChild(img);
    
    // Add the link to the container
    container.appendChild(link);
    
    // Add instructions
    const instructions = document.createElement('p');
    instructions.textContent = 'Tap the image to view in AR';
    instructions.style.color = 'white';
    instructions.style.marginTop = '20px';
    container.appendChild(instructions);
    
    // Add a cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.marginTop = '30px';
    cancelButton.style.padding = '10px 20px';
    cancelButton.style.backgroundColor = 'white';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '5px';
    cancelButton.style.cursor = 'pointer';
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(container);
    });
    container.appendChild(cancelButton);
    
    // Add the container to the body
    document.body.appendChild(container);
    
    console.log('AR Quick Look interface displayed');
}