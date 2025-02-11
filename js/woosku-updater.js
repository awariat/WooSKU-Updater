function trimTitle(title) {
    const maxLength = 40; // Total length of trimmed string
    const sideLength = 20; // Length to take from each side
    if (title.length > maxLength) {
        return title.substring(0, sideLength) + ' ... ' + title.substring(title.length - sideLength);
    }
    return title;
}

document.addEventListener('DOMContentLoaded', function () {
    // Initialize DataTable
    // Initialize DataTable
    console.log("wooSkuData", wooSkuData);
    const table = new DataTable('#wooSkuTable', {
        data: wooSkuData.map(product => [
            product.sku,
            trimTitle(product.title),
            product.categories,
            product.tags,
            product.parent_sku,
            product.product_id,
            `<div class='input-group'>
                <button class='btn btn-sm btn-danger btn-down' type='button'>
                    <i class='bi bi-arrow-down-square'></i>
                </button>
                <input size='7' class="qty-input form-control text-center" type="text" value="${product.qty || 0}" data-iniqty="${product.qty || 0}"/>
                <button class='btn btn-sm btn-success btn-up' type='button'>
                    <i class='bi bi-arrow-up-square'></i>
                </button>
            </div>`,
            `<input size='7' class="price-input form-control text-center" type="text" value="${product.price || 0}" data-iniprice="${product.price || 0}" />`,
            `<div class='d-grid'><button class="save-btn btn btn-primary" data-product-id="${product.product_id}"><i class="bi bi-floppy m-0 p-0"></i></button></div>`,
        ]),
        columns: [
            { title: 'SKU', className: 'text-left' },
            { title: 'Title', className: 'text-left' },
            { title: 'Categories', className: 'text-center', visible: false },
            { title: 'Tags', className: 'text-center', visible: false },
            { title: 'Parent', className: 'text-center', visible: false },
            { title: 'ID', className: 'text-center', visible: false },
            { title: 'QTY', className: 'text-center' },
            { title: 'PRICE', className: 'text-center' },
            { title: '<i class="bi bi-floppy-fill"></i>', orderable: false, searchable: false, className: 'text-center' },
        ],
        paging: true,
        searching: true,
        ordering: true,
    });

    const tableHeaders = document.querySelectorAll('#wooSkuTable thead tr th');

    // Add Bootstrap classes to the header
    tableHeaders.forEach(th => {
        th.classList.add('bg-primary', 'text-white');
    });





    const categoriesContent = document.getElementById('categories');
    const tagsContent = document.getElementById('tags');
    const parentSkuContent = document.getElementById('parents');

    // Arrays to hold the flattened categories, tags, and parent SKU
    let allCategories = [];
    let allTags = [];
    let allParentSku = [];

    // Loop through the product data and gather categories, tags, and parent SKUs
    wooSkuData.forEach(product => {
        // Flatten and store unique categories (convert to array if not already)
        if (product.categories) {
            const categories = Array.isArray(product.categories) ? product.categories : product.categories.split(',').map(category => category.trim());
            allCategories = allCategories.concat(categories);
        }

        // Flatten and store unique tags (split by commas and remove empty tags)
        if (product.tags) {
            const tags = Array.isArray(product.tags) ? product.tags : product.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== "");
            allTags = allTags.concat(tags);
        }

        // Flatten and store unique parent SKUs (split by commas if not already an array)
        if (product.parent_sku) {
            const parentSkus = Array.isArray(product.parent_sku) ? product.parent_sku : product.parent_sku.split(',').map(sku => sku.trim());
            allParentSku = allParentSku.concat(parentSkus);
        }
    });


    // Remove duplicate values from categories, tags, and parent SKU arrays and sort them alphabetically
    // Remove duplicate values, normalize spacing, and sort alphabetically
    allCategories = [...new Set(allCategories)]
        .map(category => category.trim())  // Normalize spaces
        .sort((a, b) => a.localeCompare(b)); // Sort alphabetically
    // Remove duplicate values, normalize spacing, and sort alphabetically
    allTags = [...new Set(allTags)]  // Remove duplicates
        .map(tag => tag.trim())       // Normalize spaces
        .sort((a, b) => a.localeCompare(b)); // Sort alphabetically
    allParentSku = [...new Set(allParentSku)].sort();

    console.log("allCategories", allCategories);
    console.log("allTags", allTags);
    console.log("allParentSku", allParentSku);

    // Function to add separator between buttons when the first letter changes
    function addButtonsWithSeparator(content, data, colorClass) {
        let previousLetter = '';

        data.forEach(item => {
            const firstLetter = item.charAt(0).toUpperCase();

            // Check if the first letter is different from the previous one
            if (firstLetter !== previousLetter) {
                // Add a separator (bullet) before the button
                const separator = document.createElement('span');
                separator.innerHTML = '<i class="bi bi-circle"></i>';
                separator.classList.add('separator');
                content.appendChild(separator);
            }

            // Create button
            const btn = document.createElement('button');
            btn.classList.add('btn', 'btn-sm', colorClass, 'm-1', 'btn-filter');
            btn.textContent = item;
            content.appendChild(btn);

            // Update the previousLetter for next comparison
            previousLetter = firstLetter;
        });
    }

    // Add category buttons to categories tab
    addButtonsWithSeparator(categoriesContent, allCategories, 'btn-primary');

    // Add tag buttons to tags tab, but only if there are tags
    if (allTags.length > 0) {
        addButtonsWithSeparator(tagsContent, allTags, 'btn-success');
    }

    // Add parent SKU buttons to parent SKU tab, but only if there are parent SKUs
    if (allParentSku.length > 0) {
        addButtonsWithSeparator(parentSkuContent, allParentSku, 'btn-warning');
    }



    // Add event listener to capture button clicks
    document.getElementById('wooSKUTabsWrapper').addEventListener('click', function (event) {
        if (event.target.classList.contains('btn-filter')) {
            // Get the text content of the clicked button
            const searchTerm = event.target.textContent;

            // Set the search box value to the clicked button's text
            const dtSearchBox = document.querySelector('.dt-search');
            dtSearchBox.value = searchTerm;

            // Trigger DataTable search with the new value
            $('#wooSkuTable').DataTable().search(searchTerm).draw();
        }
    });







    // Sync row indexes
    function syncRowIndexes() {
        const rows = document.querySelectorAll('#wooSkuTable tbody tr');
        rows.forEach((row, index) => {
            row.setAttribute('data-index', index);
        });
    }

    // Bind button events
    function bindButtons() {
        document.querySelectorAll('.btn-down').forEach(button => {
            button.removeEventListener('click', handleDecrease);
            button.addEventListener('click', handleDecrease);
        });

        document.querySelectorAll('.btn-up').forEach(button => {
            button.removeEventListener('click', handleIncrease);
            button.addEventListener('click', handleIncrease);
        });

        document.querySelectorAll('.save-btn').forEach(button => {
            button.removeEventListener('click', handleSave);
            button.addEventListener('click', handleSave);
        });
    }

    // Handle decrease button
    function handleDecrease(event) {
        const inputField = event.target.closest('tr').querySelector('.qty-input');
        let quantity = parseInt(inputField.value, 10);
        inputField.classList.add('bg-info', 'text-white');

        if (!isNaN(quantity) && quantity > 0) {
            inputField.value = quantity - 1;

        }
        if (inputField.value == inputField.dataset.iniqty) {
            inputField.classList.remove('bg-info', 'text-white');
        } else {
            inputField.classList.add('bg-info', 'text-white');
        }



    }

    // Handle increase button
    function handleIncrease(event) {
        const inputField = event.target.closest('tr').querySelector('.qty-input');
        let quantity = parseInt(inputField.value, 10);
        inputField.classList.add('bg-info', 'text-white');

        if (!isNaN(quantity)) {
            inputField.value = quantity + 1;
        }
        if (inputField.value == inputField.dataset.iniqty) {
            inputField.classList.remove('bg-info', 'text-white');
        } else {
            inputField.classList.add('bg-info', 'text-white');
        }


    }

    // Handle focus on input fields
    function handleFocus() {
        document.querySelectorAll('.qty-input, .price-input').forEach(input => {
            input.removeEventListener('focus', selectText);
            input.addEventListener('focus', selectText);
        });
    }

    // Select text in input field
    function selectText(event) {
        event.target.select();
    }

    // Handle save button
    function handleSave(event) {
        const button = event.target.closest('button');
        const row = button.closest('tr');
        const rowIndex = row.getAttribute('data-index'); // Map DOM row to internal data

        const quantityInput = row.querySelector('.qty-input');
        const priceInput = row.querySelector('.price-input');

        const quantity = quantityInput.value.trim();
        const price = priceInput.value.trim();
        const productId = button.getAttribute('data-product-id');

        // Save current page before refresh
        const currentPage = table.page();

        // Disable inputs and button during save
        quantityInput.classList.remove('bg-info', 'text-white');

        button.disabled = true;
        quantityInput.disabled = true;
        priceInput.disabled = true;



        fetch(ajaxurl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'save_woosku_data',
                product_id: productId,
                quantity: quantity,
                price: price,
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Save successful:', data.data.message);

                } else {
                    console.error('Save failed:', data.data.message || 'Unknown error');
                    alert('Failed to save data. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error:', error.message || 'Unknown error');
                alert('Failed to save data. Please try again.');
            })
            .finally(() => {
                // Re-enable inputs and button after save
                button.disabled = false;
                quantityInput.disabled = false;
                priceInput.disabled = false;

            // Redraw table without changing the page
            table.draw(false); 
            table.page(currentPage).draw(false);
            });
    }

    // Handle search input
    const searchInput = document.querySelector('.dataTables_filter input');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            table.search(this.value);
        });
    }

    // Initial setup
    table.on('draw', function () {
        syncRowIndexes();
        bindButtons();
        handleFocus();
    });

    // Trigger initial setup
    syncRowIndexes();
    bindButtons();
    handleFocus();
});
