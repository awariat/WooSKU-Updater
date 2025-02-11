<?php
/*
Plugin Name: WooSKU Updater
Description: A plugin to manage SKUs, quantities.
Version: 1.0
Author: name
*/
function disable_all_admin_notices_on_plugin_page()
{
    // Check if we're on the plugin's admin page
    if (isset($_GET['page']) && $_GET['page'] === 'woosku-updater') {
        remove_all_actions('admin_notices');
        remove_all_actions('all_admin_notices');
    }
}
add_action('admin_init', 'disable_all_admin_notices_on_plugin_page');
function woosku_updater_enqueue_assets($hook)
{
    // Check if we're on the correct admin page
    if ($hook !== 'toplevel_page_woosku-updater') {
        return;
    }

    // Enqueue Bootstrap and simple-datatables styles/scripts
    wp_enqueue_style('bootstrap-css', 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css');
    wp_enqueue_style('bootstrap-icons', 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css');
    wp_enqueue_script('bootstrap-js', 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js', ['jquery'], null, true);
    // Enqueue DataTables after jQuery
    wp_enqueue_style('datatables-css', 'https://cdn.datatables.net/v/bs5/jq-3.7.0/dt-2.1.8/datatables.min.css');
    wp_enqueue_script('datatables-js', 'https://cdn.datatables.net/v/bs5/jq-3.7.0/dt-2.1.8/datatables.min.js', array('jquery'), null, true);

    // Enqueue the CSS file
    wp_enqueue_style(
        'woosku-updater-css', // Handle for the stylesheet
        plugin_dir_url(__FILE__) . 'css/woosku-updater.css', // Path to the CSS file
        ['datatables-css'], // Dependencies (if any)
        '1.0.0', // Version
        'all' // Media type
    );

    wp_enqueue_script(
        'woosku-updater-js',
        plugin_dir_url(__FILE__) . 'js/woosku-updater.js', // Adjust path as needed
        ['datatables-js'],
        null,
        true
    );
}
add_action('admin_enqueue_scripts', 'woosku_updater_enqueue_assets');

function save_woosku_data()
{
    if (!current_user_can('manage_options')) {
        wp_send_json_error(['message' => 'Permission denied']);
    }

    $product_id = intval($_POST['product_id']);
    $quantity = intval($_POST['quantity']);
    $price = floatval($_POST['price']);

    $product = wc_get_product($product_id);
    if ($product) {
        $product->set_stock_quantity($quantity);
        $product->set_regular_price($price);
        $product->save();

        wp_send_json_success(['message' => 'Product data saved successfully']);
    } else {
        wp_send_json_error(['message' => 'Product not found']);
    }
}
add_action('wp_ajax_save_woosku_data', 'save_woosku_data');

// Add the WooSKU Updater admin menu
function woosku_updater_menu()
{
    add_menu_page(
        'WooSKU Updater',      // Page title
        'WooSKU Updater',      // Menu title
        'manage_options',      // Required capability
        'woosku-updater',      // Menu slug
        'woosku_updater_page', // Function to display the admin page content
        'dashicons-update',    // Icon
        100                    // Position
    );
}
add_action('admin_menu', 'woosku_updater_menu');

// Render the page with table of products
function woosku_updater_page()
{
    echo '<div id="wooSKUUpdaterWrapper" class="wrap">';
    echo '<div class="container-lg">';
    echo '<div class="p-2 bg-primary text-white"><h1>WooSKU Updater</h1></div>';
    echo '<div id="wooSKUTabsWrapper" class="p-2">
            <ul class="nav nav-tabs" id="myTab" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="categories-tab" data-bs-toggle="tab" data-bs-target="#categories" type="button" role="tab" aria-controls="categories" aria-selected="true">Categories</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="tags-tab" data-bs-toggle="tab" data-bs-target="#tags" type="button" role="tab" aria-controls="tags" aria-selected="false">Tags</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="parents-tab" data-bs-toggle="tab" data-bs-target="#parents" type="button" role="tab" aria-controls="parents" aria-selected="false">Parents</button>
                </li>
            </ul>
            <div class="tab-content mt-2" id="myTabContent">
                <div class="tab-pane fade show active" id="categories" role="tabpanel" aria-labelledby="categories-tab"></div>
                <div class="tab-pane fade" id="tags" role="tabpanel" aria-labelledby="tags-tab"></div>
                <div class="tab-pane fade" id="parents" role="tabpanel" aria-labelledby="parents-tab"></div>
            </div>
            </div>
';




    echo '<table id="wooSkuTable" class="table table-striped table-hover table-sm align-middle"></table>';
    echo '</div>';//container
    echo '</div>';//wrap

    $data = get_woosku_data(); // Fetch the data

    // Encode data and pass it to JavaScript
    echo '<script type="text/javascript">';
    echo 'const wooSkuData = ' . wp_json_encode($data) . ';'; // Safer encoding
    echo '</script>';

}
function get_woosku_data()
{
    $args = [
        'status' => 'publish',
        'limit' => -1, // Fetch all products, adjust if needed
        'return' => 'ids',
    ];

    $products = wc_get_products($args);
    $data = [];

    foreach ($products as $product_id) {
        $product = wc_get_product($product_id);

        // Get product categories
        $categories = wp_get_post_terms($product_id, 'product_cat', ['fields' => 'names']);

        // Get product tags
        $tags = wp_get_post_terms($product_id, 'product_tag', ['fields' => 'names']);

        // Get the parent SKU for variations (only applicable for variable products)
        $parent_sku = null;
        if ($product->is_type('variable')) {
            $parent_sku = $product->get_sku();
        }

        // Handle simple products
        if ($product->is_type('simple')) {
            $data[] = [
                'sku' => $product->get_sku(),
                'title' => $product->get_name(),
                'qty' => $product->get_stock_quantity(),
                'price' => $product->get_price(),
                'categories' => implode(', ', $categories), // Categories as comma-separated string
                'tags' => implode(', ', $tags), // Tags as comma-separated string
                'parent_sku' => $parent_sku, // Parent SKU if available
                'product_id' => $product_id,
            ];
        }

        // Handle variable products
        if ($product->is_type('variable')) {
            $variations = $product->get_children();
            foreach ($variations as $variation_id) {
                $variation = wc_get_product($variation_id);
                $data[] = [
                    'sku' => $variation->get_sku(),
                    'title' => $variation->get_name(),
                    'qty' => $variation->get_stock_quantity(),
                    'price' => $variation->get_price(),
                    'categories' => implode(', ', $categories), // Categories as comma-separated string
                    'tags' => implode(', ', $tags), // Tags as comma-separated string
                    'parent_sku' => $parent_sku, // Parent SKU for variations
                    'product_id' => $variation_id,
                ];
            }
        }
    }

    return $data; // Properly return the data as an array
}


// Fetch product data for DataTable
/*function get_woosku_data()
{
    $args = [
        'status' => 'publish',
        'limit' => 1,//-1
        'return' => 'ids',
    ];

    $products = wc_get_products($args);
    $data = [];

    foreach ($products as $product_id) {
        $product = wc_get_product($product_id);

        // Handle simple products
        if ($product->is_type('simple')) {
            $data[] = [
                'sku' => $product->get_sku(),
                'title' => $product->get_name(),
                'qty' => $product->get_stock_quantity(),
                'price' => $product->get_price(),
                'product_id' => $product_id,
            ];
        }

        // Handle variable products
        if ($product->is_type('variable')) {
            $variations = $product->get_children();
            foreach ($variations as $variation_id) {
                $variation = wc_get_product($variation_id);
                $data[] = [
                    'sku' => $variation->get_sku(),
                    'title' => $variation->get_name(),
                    'qty' => $variation->get_stock_quantity(),
                    'price' => $variation->get_price(),
                    'product_id' => $variation_id,
                ];
            }
        }
    }

    return $data; // Properly return the data as an array
}*/
