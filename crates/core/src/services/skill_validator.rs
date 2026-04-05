use once_cell::sync::Lazy;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

static SKILL_NAME_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^[a-z0-9]+(-[a-z0-9]+)*$").unwrap());

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillFrontmatter {
    pub name: String,
    pub description: Option<String>,
    pub version: Option<String>,
    pub author: Option<String>,
    pub license: Option<String>,
    pub compatibility: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedSkillMd {
    pub frontmatter: SkillFrontmatter,
    pub body: String,
    pub raw: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub data: Option<ParsedSkillMd>,
}

pub fn validate_skill_name(name: &str) -> bool {
    !name.is_empty() && name.len() <= 64 && SKILL_NAME_REGEX.is_match(name)
}

pub fn get_skill_name_error(name: &str) -> Option<String> {
    if name.is_empty() {
        return Some("Skill name cannot be empty".to_string());
    }
    if name.len() > 64 {
        return Some(format!(
            "Skill name must be 64 characters or less, got {}",
            name.len()
        ));
    }
    if !SKILL_NAME_REGEX.is_match(name) {
        return Some(
            "Skill name must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen".to_string(),
        );
    }
    None
}

fn parse_frontmatter_value(value: &str) -> String {
    let trimmed = value.trim();
    if (trimmed.starts_with('"') && trimmed.ends_with('"'))
        || (trimmed.starts_with('\'') && trimmed.ends_with('\''))
    {
        trimmed[1..trimmed.len() - 1].to_string()
    } else {
        trimmed.to_string()
    }
}

fn parse_array_value(value: &str) -> Vec<String> {
    let trimmed = value.trim();
    if trimmed.starts_with('[') && trimmed.ends_with(']') {
        let inner = &trimmed[1..trimmed.len() - 1];
        inner
            .split(',')
            .map(|s| parse_frontmatter_value(s))
            .filter(|s| !s.is_empty())
            .collect()
    } else {
        vec![parse_frontmatter_value(value)]
    }
}

pub fn parse_skill_md(content: &str) -> Option<ParsedSkillMd> {
    let trimmed = content.trim();
    if !trimmed.starts_with("---") {
        return None;
    }

    let after_first = &trimmed[3..];
    let end_index = after_first.find("\n---")?;
    let yaml_block = &after_first[..end_index];
    let body_start = end_index + 4;
    let body = if body_start < after_first.len() {
        after_first[body_start..].trim().to_string()
    } else {
        String::new()
    };

    let mut fields: HashMap<String, String> = HashMap::new();
    let mut current_key: Option<String> = None;

    for line in yaml_block.lines() {
        let trimmed_line = line.trim();
        if trimmed_line.is_empty() {
            continue;
        }

        if let Some(colon_pos) = trimmed_line.find(':') {
            let key = trimmed_line[..colon_pos].trim().to_string();
            let val = trimmed_line[colon_pos + 1..].trim().to_string();

            if val.is_empty() {
                current_key = Some(key);
            } else {
                fields.insert(key, val);
                current_key = None;
            }
        } else if let Some(ref key) = current_key {
            let existing = fields.entry(key.clone()).or_default();
            if !existing.is_empty() {
                existing.push('\n');
            }
            existing.push_str(trimmed_line);
        }
    }

    let name = fields.get("name").map(|v| parse_frontmatter_value(v))?;

    let frontmatter = SkillFrontmatter {
        name,
        description: fields
            .get("description")
            .map(|v| parse_frontmatter_value(v)),
        version: fields.get("version").map(|v| parse_frontmatter_value(v)),
        author: fields.get("author").map(|v| parse_frontmatter_value(v)),
        license: fields.get("license").map(|v| parse_frontmatter_value(v)),
        compatibility: fields
            .get("compatibility")
            .map(|v| parse_frontmatter_value(v)),
        tags: fields.get("tags").map(|v| parse_array_value(v)),
    };

    Some(ParsedSkillMd {
        frontmatter,
        body,
        raw: content.to_string(),
    })
}

pub fn validate_skill_md(content: &str, directory_name: Option<&str>) -> ValidationResult {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    if content.trim().is_empty() {
        return ValidationResult {
            valid: false,
            errors: vec!["SKILL.md content is empty".to_string()],
            warnings,
            data: None,
        };
    }

    let parsed = match parse_skill_md(content) {
        Some(p) => p,
        None => {
            return ValidationResult {
                valid: false,
                errors: vec![
                    "Failed to parse SKILL.md: missing or invalid YAML frontmatter".to_string(),
                ],
                warnings,
                data: None,
            };
        }
    };

    if let Some(err) = get_skill_name_error(&parsed.frontmatter.name) {
        errors.push(format!("Invalid skill name: {}", err));
    }

    if let Some(dir_name) = directory_name {
        if dir_name != parsed.frontmatter.name {
            warnings.push(format!(
                "Skill name '{}' does not match directory name '{}'",
                parsed.frontmatter.name, dir_name
            ));
        }
    }

    if parsed.frontmatter.description.is_none() {
        warnings.push("Missing 'description' field in frontmatter".to_string());
    }

    if parsed.body.is_empty() {
        warnings.push("SKILL.md has no body content after frontmatter".to_string());
    }

    ValidationResult {
        valid: errors.is_empty(),
        errors,
        warnings,
        data: Some(parsed),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_skill_name_valid() {
        assert!(validate_skill_name("my-skill"));
        assert!(validate_skill_name("a"));
        assert!(validate_skill_name("skill-123"));
        assert!(validate_skill_name("abc"));
    }

    #[test]
    fn test_validate_skill_name_invalid() {
        assert!(!validate_skill_name(""));
        assert!(!validate_skill_name("My Skill"));
        assert!(!validate_skill_name("-leading"));
        assert!(!validate_skill_name("trailing-"));
        assert!(!validate_skill_name("UPPER"));
        assert!(!validate_skill_name(&"a".repeat(65)));
    }

    #[test]
    fn test_parse_skill_md_valid() {
        let content = "---\nname: my-skill\ndescription: A test skill\nversion: 1.0.0\n---\nBody content here";
        let parsed = parse_skill_md(content).unwrap();
        assert_eq!(parsed.frontmatter.name, "my-skill");
        assert_eq!(
            parsed.frontmatter.description.as_deref(),
            Some("A test skill")
        );
        assert_eq!(parsed.frontmatter.version.as_deref(), Some("1.0.0"));
        assert_eq!(parsed.body, "Body content here");
    }

    #[test]
    fn test_parse_skill_md_no_frontmatter() {
        let content = "Just plain text without frontmatter";
        assert!(parse_skill_md(content).is_none());
    }

    #[test]
    fn test_parse_skill_md_with_tags() {
        let content = "---\nname: tagged-skill\ntags: [coding, rust]\n---\nBody";
        let parsed = parse_skill_md(content).unwrap();
        assert_eq!(parsed.frontmatter.name, "tagged-skill");
        let tags = parsed.frontmatter.tags.unwrap();
        assert_eq!(tags.len(), 2);
        assert_eq!(tags[0], "coding");
        assert_eq!(tags[1], "rust");
    }

    #[test]
    fn test_validate_skill_md_empty() {
        let result = validate_skill_md("", None);
        assert!(!result.valid);
        assert!(!result.errors.is_empty());
    }

    #[test]
    fn test_validate_skill_md_valid_content() {
        let content = "---\nname: valid-skill\ndescription: Good skill\n---\nSome instructions";
        let result = validate_skill_md(content, None);
        assert!(result.valid);
        assert!(result.errors.is_empty());
    }

    #[test]
    fn test_validate_skill_md_name_mismatch_warning() {
        let content = "---\nname: actual-name\ndescription: desc\n---\nBody";
        let result = validate_skill_md(content, Some("different-dir"));
        assert!(result.valid);
        assert!(result.warnings.iter().any(|w| w.contains("does not match")));
    }
}
