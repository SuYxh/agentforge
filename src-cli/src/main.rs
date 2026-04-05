use std::process;

use agentforge_core::database::connection::open_database;
use agentforge_core::database::folder::FolderDB;
use agentforge_core::database::prompt::PromptDB;
use agentforge_core::database::settings::SettingsDB;
use agentforge_core::database::skill::SkillDB;
use agentforge_core::models::folder::CreateFolderDTO;
use agentforge_core::models::prompt::{CreatePromptDTO, SearchQuery, UpdatePromptDTO};
use clap::{Parser, Subcommand};
use colored::Colorize;
use comfy_table::{ContentArrangement, Table};
use rusqlite::Connection;

#[derive(Parser)]
#[command(
    name = "agentforge",
    version,
    about = "AgentForge CLI - Manage your AI prompts, skills and code"
)]
struct Cli {
    #[arg(long, help = "Custom data directory")]
    data_dir: Option<String>,

    #[arg(long, default_value = "table", help = "Output format: json, table")]
    output: String,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    #[command(about = "Manage prompts")]
    Prompt {
        #[command(subcommand)]
        action: PromptAction,
    },
    #[command(about = "Manage skills")]
    Skill {
        #[command(subcommand)]
        action: SkillAction,
    },
    #[command(about = "Manage folders")]
    Folder {
        #[command(subcommand)]
        action: FolderAction,
    },
    #[command(about = "Manage settings")]
    Setting {
        #[command(subcommand)]
        action: SettingAction,
    },
}

#[derive(Subcommand)]
enum PromptAction {
    #[command(about = "List all prompts")]
    List,
    #[command(about = "Get a prompt by ID")]
    Get { id: String },
    #[command(about = "Create a new prompt")]
    Create {
        #[arg(long)]
        title: String,
        #[arg(long)]
        content: String,
        #[arg(long)]
        description: Option<String>,
        #[arg(long)]
        system_prompt: Option<String>,
        #[arg(long, value_delimiter = ',')]
        tags: Option<Vec<String>>,
        #[arg(long)]
        folder_id: Option<String>,
    },
    #[command(about = "Update an existing prompt")]
    Update {
        id: String,
        #[arg(long)]
        title: Option<String>,
        #[arg(long)]
        content: Option<String>,
        #[arg(long)]
        description: Option<String>,
        #[arg(long, value_delimiter = ',')]
        tags: Option<Vec<String>>,
    },
    #[command(about = "Delete a prompt")]
    Delete { id: String },
    #[command(about = "Search prompts")]
    Search { query: String },
}

#[derive(Subcommand)]
enum SkillAction {
    #[command(about = "List all skills")]
    List,
    #[command(about = "Get a skill by ID")]
    Get { id: String },
    #[command(about = "Delete a skill")]
    Delete { id: String },
    #[command(about = "Search skills")]
    Search { query: String },
}

#[derive(Subcommand)]
enum FolderAction {
    #[command(about = "List all folders")]
    List,
    #[command(about = "Create a new folder")]
    Create {
        #[arg(long)]
        name: String,
        #[arg(long)]
        icon: Option<String>,
    },
    #[command(about = "Delete a folder")]
    Delete { id: String },
}

#[derive(Subcommand)]
enum SettingAction {
    #[command(about = "Get a setting value")]
    Get { key: String },
    #[command(about = "Set a setting value")]
    Set { key: String, value: String },
}

fn default_data_dir() -> String {
    dirs::data_dir()
        .map(|d| d.join("com.agentforge.app"))
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .to_string_lossy()
        .to_string()
}

fn truncate(s: &str, max: usize) -> String {
    if s.chars().count() <= max {
        s.to_string()
    } else {
        format!("{}...", s.chars().take(max - 3).collect::<String>())
    }
}

fn short_id(id: &str) -> &str {
    if id.len() >= 8 {
        &id[..8]
    } else {
        id
    }
}

fn open_db(cli: &Cli) -> Connection {
    let data_dir = cli.data_dir.clone().unwrap_or_else(default_data_dir);
    let dir_path = std::path::Path::new(&data_dir);
    if !dir_path.exists() {
        if let Err(e) = std::fs::create_dir_all(dir_path) {
            eprintln!(
                "{} Failed to create data directory: {}",
                "Error:".red().bold(),
                e
            );
            process::exit(1);
        }
    }
    let db_path = dir_path.join("agentforge.db");
    match open_database(db_path.to_str().unwrap_or("agentforge.db")) {
        Ok(conn) => conn,
        Err(e) => {
            eprintln!("{} Failed to open database: {}", "Error:".red().bold(), e);
            process::exit(1);
        }
    }
}

fn main() {
    let cli = Cli::parse();
    let conn = open_db(&cli);
    let is_json = cli.output == "json";

    let result = match cli.command {
        Commands::Prompt { action } => handle_prompt(&conn, action, is_json),
        Commands::Skill { action } => handle_skill(&conn, action, is_json),
        Commands::Folder { action } => handle_folder(&conn, action, is_json),
        Commands::Setting { action } => handle_setting(&conn, action, is_json),
    };

    if let Err(e) = result {
        eprintln!("{} {}", "Error:".red().bold(), e);
        process::exit(1);
    }
}

fn handle_prompt(conn: &Connection, action: PromptAction, is_json: bool) -> Result<(), String> {
    match action {
        PromptAction::List => {
            let prompts = PromptDB::get_all(conn).map_err(|e| e.to_string())?;
            if is_json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&prompts).map_err(|e| e.to_string())?
                );
            } else {
                if prompts.is_empty() {
                    println!("{}", "No prompts found.".dimmed());
                    return Ok(());
                }
                let mut table = Table::new();
                table.set_content_arrangement(ContentArrangement::Dynamic);
                table.set_header(vec!["ID", "Title", "Tags", "Folder", "Fav", "Created"]);
                for p in &prompts {
                    table.add_row(vec![
                        short_id(&p.id).to_string(),
                        truncate(&p.title, 40),
                        p.tags.join(", "),
                        p.folder_id
                            .clone()
                            .map(|f| truncate(&f, 8))
                            .unwrap_or_default(),
                        if p.is_favorite {
                            "★".to_string()
                        } else {
                            "".to_string()
                        },
                        truncate(&p.created_at, 19),
                    ]);
                }
                println!("{table}");
            }
        }
        PromptAction::Get { id } => {
            let prompt = PromptDB::get_by_id(conn, &id)
                .map_err(|e| e.to_string())?
                .ok_or_else(|| format!("Prompt not found: {}", id))?;
            if is_json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&prompt).map_err(|e| e.to_string())?
                );
            } else {
                println!("{}: {}", "ID".cyan().bold(), prompt.id);
                println!("{}: {}", "Title".cyan().bold(), prompt.title);
                println!(
                    "{}: {}",
                    "Description".cyan().bold(),
                    prompt.description.as_deref().unwrap_or("-")
                );
                println!(
                    "{}: {}",
                    "System Prompt".cyan().bold(),
                    prompt.system_prompt.as_deref().unwrap_or("-")
                );
                println!("{}: {}", "User Prompt".cyan().bold(), prompt.user_prompt);
                println!("{}: {}", "Tags".cyan().bold(), prompt.tags.join(", "));
                println!(
                    "{}: {}",
                    "Folder".cyan().bold(),
                    prompt.folder_id.as_deref().unwrap_or("-")
                );
                println!(
                    "{}: {}",
                    "Favorite".cyan().bold(),
                    if prompt.is_favorite { "Yes" } else { "No" }
                );
                println!("{}: {}", "Version".cyan().bold(), prompt.version);
                println!("{}: {}", "Usage Count".cyan().bold(), prompt.usage_count);
                println!("{}: {}", "Created".cyan().bold(), prompt.created_at);
                println!("{}: {}", "Updated".cyan().bold(), prompt.updated_at);
            }
        }
        PromptAction::Create {
            title,
            content,
            description,
            system_prompt,
            tags,
            folder_id,
        } => {
            let dto = CreatePromptDTO {
                title,
                user_prompt: content,
                description,
                prompt_type: None,
                system_prompt,
                system_prompt_en: None,
                user_prompt_en: None,
                variables: None,
                tags,
                folder_id,
                images: None,
                videos: None,
                source: None,
                notes: None,
            };
            let prompt = PromptDB::create(conn, dto).map_err(|e| e.to_string())?;
            if is_json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&prompt).map_err(|e| e.to_string())?
                );
            } else {
                println!(
                    "{} Prompt created: {} ({})",
                    "✓".green().bold(),
                    prompt.title,
                    short_id(&prompt.id)
                );
            }
        }
        PromptAction::Update {
            id,
            title,
            content,
            description,
            tags,
        } => {
            let dto = UpdatePromptDTO {
                title,
                user_prompt: content,
                description,
                prompt_type: None,
                system_prompt: None,
                system_prompt_en: None,
                user_prompt_en: None,
                variables: None,
                tags,
                folder_id: None,
                images: None,
                videos: None,
                is_favorite: None,
                is_pinned: None,
                usage_count: None,
                source: None,
                notes: None,
                last_ai_response: None,
            };
            let prompt = PromptDB::update(conn, &id, dto).map_err(|e| e.to_string())?;
            if is_json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&prompt).map_err(|e| e.to_string())?
                );
            } else {
                println!(
                    "{} Prompt updated: {} ({})",
                    "✓".green().bold(),
                    prompt.title,
                    short_id(&prompt.id)
                );
            }
        }
        PromptAction::Delete { id } => {
            let deleted = PromptDB::delete(conn, &id).map_err(|e| e.to_string())?;
            if is_json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&serde_json::json!({ "deleted": deleted }))
                        .map_err(|e| e.to_string())?
                );
            } else if deleted {
                println!("{} Prompt deleted: {}", "✓".green().bold(), short_id(&id));
            } else {
                println!("{} Prompt not found: {}", "✗".red().bold(), short_id(&id));
            }
        }
        PromptAction::Search { query } => {
            let sq = SearchQuery {
                keyword: Some(query),
                tags: None,
                folder_id: None,
                is_favorite: None,
                sort_by: None,
                sort_order: None,
                limit: None,
                offset: None,
            };
            let prompts = PromptDB::search(conn, sq).map_err(|e| e.to_string())?;
            if is_json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&prompts).map_err(|e| e.to_string())?
                );
            } else {
                if prompts.is_empty() {
                    println!("{}", "No matching prompts found.".dimmed());
                    return Ok(());
                }
                let mut table = Table::new();
                table.set_content_arrangement(ContentArrangement::Dynamic);
                table.set_header(vec!["ID", "Title", "Tags", "Folder", "Fav", "Created"]);
                for p in &prompts {
                    table.add_row(vec![
                        short_id(&p.id).to_string(),
                        truncate(&p.title, 40),
                        p.tags.join(", "),
                        p.folder_id
                            .clone()
                            .map(|f| truncate(&f, 8))
                            .unwrap_or_default(),
                        if p.is_favorite {
                            "★".to_string()
                        } else {
                            "".to_string()
                        },
                        truncate(&p.created_at, 19),
                    ]);
                }
                println!("{table}");
            }
        }
    }
    Ok(())
}

fn handle_skill(conn: &Connection, action: SkillAction, is_json: bool) -> Result<(), String> {
    match action {
        SkillAction::List => {
            let skills = SkillDB::get_all(conn).map_err(|e| e.to_string())?;
            if is_json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&skills).map_err(|e| e.to_string())?
                );
            } else {
                if skills.is_empty() {
                    println!("{}", "No skills found.".dimmed());
                    return Ok(());
                }
                let mut table = Table::new();
                table.set_content_arrangement(ContentArrangement::Dynamic);
                table.set_header(vec!["ID", "Name", "Description", "Author", "Category"]);
                for s in &skills {
                    table.add_row(vec![
                        short_id(&s.id).to_string(),
                        truncate(&s.name, 30),
                        truncate(s.description.as_deref().unwrap_or(""), 50),
                        s.author.clone().unwrap_or_default(),
                        s.category.clone().unwrap_or_default(),
                    ]);
                }
                println!("{table}");
            }
        }
        SkillAction::Get { id } => {
            let skill = SkillDB::get_by_id(conn, &id)
                .map_err(|e| e.to_string())?
                .ok_or_else(|| format!("Skill not found: {}", id))?;
            if is_json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&skill).map_err(|e| e.to_string())?
                );
            } else {
                println!("{}: {}", "ID".cyan().bold(), skill.id);
                println!("{}: {}", "Name".cyan().bold(), skill.name);
                println!(
                    "{}: {}",
                    "Description".cyan().bold(),
                    skill.description.as_deref().unwrap_or("-")
                );
                println!(
                    "{}: {}",
                    "Content".cyan().bold(),
                    truncate(skill.content.as_deref().unwrap_or("-"), 200)
                );
                println!(
                    "{}: {}",
                    "Author".cyan().bold(),
                    skill.author.as_deref().unwrap_or("-")
                );
                println!(
                    "{}: {}",
                    "Version".cyan().bold(),
                    skill.version.as_deref().unwrap_or("-")
                );
                println!(
                    "{}: {}",
                    "Category".cyan().bold(),
                    skill.category.as_deref().unwrap_or("-")
                );
                println!(
                    "{}: {}",
                    "Tags".cyan().bold(),
                    skill
                        .tags
                        .as_ref()
                        .map(|t| t.join(", "))
                        .unwrap_or_default()
                );
                println!(
                    "{}: {}",
                    "Favorite".cyan().bold(),
                    if skill.is_favorite { "Yes" } else { "No" }
                );
                println!("{}: {}", "Created".cyan().bold(), skill.created_at);
                println!("{}: {}", "Updated".cyan().bold(), skill.updated_at);
            }
        }
        SkillAction::Delete { id } => {
            let deleted = SkillDB::delete(conn, &id).map_err(|e| e.to_string())?;
            if is_json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&serde_json::json!({ "deleted": deleted }))
                        .map_err(|e| e.to_string())?
                );
            } else if deleted {
                println!("{} Skill deleted: {}", "✓".green().bold(), short_id(&id));
            } else {
                println!("{} Skill not found: {}", "✗".red().bold(), short_id(&id));
            }
        }
        SkillAction::Search { query } => {
            let skills = SkillDB::search(conn, &query).map_err(|e| e.to_string())?;
            if is_json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&skills).map_err(|e| e.to_string())?
                );
            } else {
                if skills.is_empty() {
                    println!("{}", "No matching skills found.".dimmed());
                    return Ok(());
                }
                let mut table = Table::new();
                table.set_content_arrangement(ContentArrangement::Dynamic);
                table.set_header(vec!["ID", "Name", "Description", "Author", "Category"]);
                for s in &skills {
                    table.add_row(vec![
                        short_id(&s.id).to_string(),
                        truncate(&s.name, 30),
                        truncate(s.description.as_deref().unwrap_or(""), 50),
                        s.author.clone().unwrap_or_default(),
                        s.category.clone().unwrap_or_default(),
                    ]);
                }
                println!("{table}");
            }
        }
    }
    Ok(())
}

fn handle_folder(conn: &Connection, action: FolderAction, is_json: bool) -> Result<(), String> {
    match action {
        FolderAction::List => {
            let folders = FolderDB::get_all(conn).map_err(|e| e.to_string())?;
            if is_json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&folders).map_err(|e| e.to_string())?
                );
            } else {
                if folders.is_empty() {
                    println!("{}", "No folders found.".dimmed());
                    return Ok(());
                }
                let mut table = Table::new();
                table.set_content_arrangement(ContentArrangement::Dynamic);
                table.set_header(vec!["ID", "Name", "Icon", "Order"]);
                for f in &folders {
                    table.add_row(vec![
                        short_id(&f.id).to_string(),
                        f.name.clone(),
                        f.icon.clone().unwrap_or_default(),
                        f.order.to_string(),
                    ]);
                }
                println!("{table}");
            }
        }
        FolderAction::Create { name, icon } => {
            let dto = CreateFolderDTO {
                name,
                icon,
                parent_id: None,
                is_private: None,
            };
            let folder = FolderDB::create(conn, dto).map_err(|e| e.to_string())?;
            if is_json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&folder).map_err(|e| e.to_string())?
                );
            } else {
                println!(
                    "{} Folder created: {} ({})",
                    "✓".green().bold(),
                    folder.name,
                    short_id(&folder.id)
                );
            }
        }
        FolderAction::Delete { id } => {
            let deleted = FolderDB::delete(conn, &id).map_err(|e| e.to_string())?;
            if is_json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&serde_json::json!({ "deleted": deleted }))
                        .map_err(|e| e.to_string())?
                );
            } else if deleted {
                println!("{} Folder deleted: {}", "✓".green().bold(), short_id(&id));
            } else {
                println!("{} Folder not found: {}", "✗".red().bold(), short_id(&id));
            }
        }
    }
    Ok(())
}

fn handle_setting(conn: &Connection, action: SettingAction, is_json: bool) -> Result<(), String> {
    match action {
        SettingAction::Get { key } => {
            let value = SettingsDB::get(conn, &key).map_err(|e| e.to_string())?;
            if is_json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&serde_json::json!({
                        "key": key,
                        "value": value,
                    }))
                    .map_err(|e| e.to_string())?
                );
            } else {
                match value {
                    Some(v) => println!("{}: {}", key.cyan().bold(), v),
                    None => println!("{} Setting not found: {}", "✗".red().bold(), key),
                }
            }
        }
        SettingAction::Set { key, value } => {
            SettingsDB::set(conn, &key, &value).map_err(|e| e.to_string())?;
            if is_json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&serde_json::json!({
                        "key": key,
                        "value": value,
                    }))
                    .map_err(|e| e.to_string())?
                );
            } else {
                println!(
                    "{} Setting updated: {} = {}",
                    "✓".green().bold(),
                    key,
                    value
                );
            }
        }
    }
    Ok(())
}
