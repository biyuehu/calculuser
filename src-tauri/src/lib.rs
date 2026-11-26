#[tauri::command]
fn open_external_url(url: String) -> Result<(), String> {
  if !(url.starts_with("https://") || url.starts_with("http://"))
    || url.chars().any(|c| c.is_control() || c.is_whitespace())
  {
    return Err("Unsupported external URL".to_string());
  }

  #[cfg(target_os = "windows")]
  let mut command = {
    let mut cmd = std::process::Command::new("rundll32");
    cmd.args(["url.dll,FileProtocolHandler", &url]);
    cmd
  };
  #[cfg(target_os = "macos")]
  let mut command = {
    let mut cmd = std::process::Command::new("open");
    cmd.arg(&url);
    cmd
  };
  #[cfg(all(unix, not(target_os = "macos")))]
  let mut command = {
    let mut cmd = std::process::Command::new("xdg-open");
    cmd.arg(&url);
    cmd
  };

  command.spawn().map(|_| ()).map_err(|err| err.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![open_external_url])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
