mod commands;
mod setup;
mod state;

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder};
use tauri::Manager;

#[cfg(target_os = "macos")]
fn apply_macos_rounded_corners(app: &tauri::App) {
    use cocoa::appkit::{NSView, NSWindow, NSWindowStyleMask};
    use cocoa::base::{id, YES};

    if let Some(window) = app.get_webview_window("main") {
        let ns_window = window.ns_window().unwrap() as id;
        unsafe {
            ns_window.setTitlebarAppearsTransparent_(YES);
            ns_window
                .setTitleVisibility_(cocoa::appkit::NSWindowTitleVisibility::NSWindowTitleHidden);

            let style_mask =
                ns_window.styleMask() | NSWindowStyleMask::NSFullSizeContentViewWindowMask;
            ns_window.setStyleMask_(style_mask);

            ns_window.setHasShadow_(YES);

            let content_view: id = ns_window.contentView();
            let _: () = msg_send![content_view, setWantsLayer: YES];
            let layer: id = msg_send![content_view, layer];
            let _: () = msg_send![layer, setCornerRadius: 12.0_f64];
            let _: () = msg_send![layer, setMasksToBounds: YES];

            let subviews: id = msg_send![content_view, subviews];
            let count: usize = msg_send![subviews, count];
            for i in 0..count {
                let subview: id = msg_send![subviews, objectAtIndex: i];
                let _: () = msg_send![subview, setWantsLayer: YES];
                let sub_layer: id = msg_send![subview, layer];
                let _: () = msg_send![sub_layer, setCornerRadius: 12.0_f64];
                let _: () = msg_send![sub_layer, setMasksToBounds: YES];
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_state = setup::initialize(app)?;
            app.manage(app_state);

            #[cfg(target_os = "macos")]
            apply_macos_rounded_corners(app);

            let show_item = MenuItemBuilder::with_id("show", "Show/Hide").build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
            let menu = MenuBuilder::new(app)
                .item(&show_item)
                .item(&quit_item)
                .build()?;

            TrayIconBuilder::new()
                .menu(&menu)
                .on_menu_event(
                    |app: &tauri::AppHandle, event: tauri::menu::MenuEvent| match event
                        .id()
                        .as_ref()
                    {
                        "show" => {
                            if let Some(w) = app.get_webview_window("main") {
                                if w.is_visible().unwrap_or(false) {
                                    let _ = w.hide();
                                } else {
                                    let _ = w.show();
                                    let _ = w.set_focus();
                                }
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    },
                )
                .on_tray_icon_event(
                    |tray: &tauri::tray::TrayIcon, event: tauri::tray::TrayIconEvent| {
                        if let tauri::tray::TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } = event
                        {
                            if let Some(w) = tray.app_handle().get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                    },
                )
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::backup::backup_export_data,
            commands::backup::backup_import_data,
            commands::backup::backup_clear_database,
            commands::prompt::prompt_create,
            commands::prompt::prompt_get,
            commands::prompt::prompt_get_all,
            commands::prompt::prompt_update,
            commands::prompt::prompt_delete,
            commands::prompt::prompt_search,
            commands::prompt::prompt_copy,
            commands::prompt::version_get_all,
            commands::prompt::version_create,
            commands::prompt::version_rollback,
            commands::folder::folder_create,
            commands::folder::folder_get_all,
            commands::folder::folder_update,
            commands::folder::folder_delete,
            commands::folder::folder_reorder,
            commands::settings::settings_get,
            commands::settings::settings_set,
            commands::skill::skill_create,
            commands::skill::skill_get,
            commands::skill::skill_get_all,
            commands::skill::skill_update,
            commands::skill::skill_delete,
            commands::skill::skill_delete_all,
            commands::skill::skill_search,
            commands::skill::skill_version_get_all,
            commands::skill::skill_version_create,
            commands::skill::skill_version_rollback,
            commands::skill::skill_version_insert_direct,
            commands::skill::skill_list_local_files,
            commands::skill::skill_read_local_file,
            commands::skill::skill_read_local_files,
            commands::skill::skill_write_local_file,
            commands::skill::skill_delete_local_file,
            commands::skill::skill_create_local_dir,
            commands::skill::skill_get_repo_path,
            commands::skill::skill_save_to_repo,
            commands::skill::skill_rename_local_path,
            commands::skill::skill_fetch_remote_content,
            commands::image::image_save,
            commands::image::image_save_buffer,
            commands::image::image_download,
            commands::image::image_list,
            commands::image::image_get_size,
            commands::image::image_read_base64,
            commands::image::image_save_base64,
            commands::image::image_exists,
            commands::image::image_clear,
            commands::image::image_get_path,
            commands::image::video_save,
            commands::image::video_list,
            commands::image::video_get_size,
            commands::image::video_read_base64,
            commands::image::video_save_base64,
            commands::image::video_exists,
            commands::image::video_clear,
            commands::image::video_get_path,
            commands::webdav::webdav_test_connection,
            commands::webdav::webdav_ensure_directory,
            commands::webdav::webdav_upload,
            commands::webdav::webdav_download,
            commands::webdav::webdav_stat,
            commands::webdav::webdav_delete,
            commands::security::security_status,
            commands::security::security_set_master_password,
            commands::security::security_unlock,
            commands::security::security_lock,
            commands::security::security_encrypt,
            commands::security::security_decrypt,
            commands::platform::platform_get_all,
            commands::platform::platform_detect_installed,
            commands::platform::platform_install_skill,
            commands::platform::platform_uninstall_skill,
            commands::platform::platform_check_skill_status,
            commands::platform::platform_get_all_deployed_skills,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
