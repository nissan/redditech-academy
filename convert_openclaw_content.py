
import yaml
import json
import os
import re
import shutil

SOURCE_DIR = "/tmp/academy/course/"
TARGET_BASE_DIR = "/Users/loki/redditech-academy/content/courses/openclaw-academy/modules/"

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return text

def convert_meta_to_module_json(meta_path, module_id, module_title, module_description, module_order, module_icon):
    module_json_content = {
        "id": module_id,
        "slug": module_id,
        "order": module_order,
        "title": module_title,
        "description": module_description,
        "difficulty": "intermediate", # Default to intermediate
        "estimatedHours": 0.5, # Placeholder, will be updated by script if present
        "badge": {
            "name": f"{module_title} Badge",
            "icon": module_icon,
            "description": f"Completed the {module_title} module"
        },
        "learningObjectives": [],
        "prerequisiteModules": []
    }
    
    with open(meta_path, 'r') as f:
        meta_data = yaml.safe_load(f)
        if 'duration_hours' in meta_data:
            module_json_content['estimatedHours'] = meta_data['duration_hours']
        if 'learning_objectives' in meta_data:
            module_json_content['learningObjectives'] = meta_data['learning_objectives']

    return json.dumps(module_json_content, indent=2)

def convert_quiz_to_quiz_json(quiz_path, module_title):
    with open(quiz_path, 'r') as f:
        quiz_data = yaml.safe_load(f)

    questions = []
    for q in quiz_data.get('questions', []):
        options = [opt['text'] for opt in q['options']]
        correct_index = -1
        for i, opt in enumerate(q['options']):
            if opt['id'] == q['correct']:
                correct_index = i
                break
        
        questions.append({
            "id": q.get('id', slugify(q['text'])),
            "question": q['text'],
            "options": options,
            "correctAnswer": correct_index,
            "explanation": q.get('explanation', '')
        })

    quiz_json_content = {
        "passingScore": quiz_data.get('passing_score', 70),
        "questions": questions
    }
    return json.dumps(quiz_json_content, indent=2)

def convert_md_to_mdx(md_path, lesson_meta):
    with open(md_path, 'r') as f:
        content = f.read()

    # Extract title from first H1
    title_match = re.match(r'^#\s+(.*)', content)
    title = lesson_meta['title']
    if title_match:
        title = title_match.group(1).strip()
        content = re.sub(r'^#\s+.*\n', '', content, 1) # Remove the first H1

    # Extract key takeaways (simple bullet list near the end)
    key_takeaways = []
    takeaways_match = re.search(r'\n\n(?:\*|-)\s+(.*?)(?:\n(?:\*|-)\s+.*)*\n*$', content, re.DOTALL)
    if takeaways_match:
        for line in takeaways_match.group(0).strip().split('\n'):
            if re.match(r'^(?:\*|-)\s+(.*)', line):
                key_takeaways.append(re.match(r'^(?:\*|-)\s+(.*)', line).group(1).strip())
        content = content[:takeaways_match.start()] # Remove takeaways from content

    frontmatter = {
        "title": title,
        "description": lesson_meta.get('description', f"Lesson on {title}"),
        "slug": lesson_meta['slug'],
        "duration": lesson_meta['duration_min'],
        "order": lesson_meta.get('order', 1), # Default order 1 if not specified
        "keyTakeaways": key_takeaways if key_takeaways else [f"Understand {title.lower().split(':')[0].strip()}"],
    }

    frontmatter_str = yaml.dump(frontmatter, sort_keys=False, default_flow_style=False)
    return f"---\n{frontmatter_str}---\n\n{content.strip()}"

def main():
    for module_dir_name in os.listdir(SOURCE_DIR):
        module_path = os.path.join(SOURCE_DIR, module_dir_name)
        if not os.path.isdir(module_path) or module_dir_name == 'oauth-trainer': # Skip oauth-trainer and outline.md
            continue

        target_module_path = os.path.join(TARGET_BASE_DIR, module_dir_name)
        os.makedirs(target_module_path, exist_ok=True)
        os.makedirs(os.path.join(target_module_path, "lessons"), exist_ok=True)

        meta_yaml_path = os.path.join(module_path, "meta.yaml")
        quiz_yaml_path = os.path.join(module_path, "quiz.yaml")

        if os.path.exists(meta_yaml_path):
            with open(meta_yaml_path, 'r') as f:
                meta_data = yaml.safe_load(f)
            
            module_id = meta_data.get('id', module_dir_name)
            module_title = meta_data.get('title', module_dir_name.replace('-', ' ').title())
            module_description = meta_data.get('description', '')
            module_order = meta_data.get('order', 1)
            module_icon = meta_data.get('icon', '💡')

            module_json_content = convert_meta_to_module_json(meta_yaml_path, module_id, module_title, module_description, module_order, module_icon)
            with open(os.path.join(target_module_path, "module.json"), "w") as f:
                f.write(module_json_content)

            for lesson in meta_data.get('lessons', []):
                md_file_name = lesson['file']
                md_path = os.path.join(module_path, md_file_name)
                if os.path.exists(md_path):
                    mdx_content = convert_md_to_mdx(md_path, lesson)
                    mdx_target_path = os.path.join(target_module_path, "lessons", md_file_name.replace(".md", ".mdx"))
                    with open(mdx_target_path, "w") as f:
                        f.write(mdx_content)
                else:
                    print(f"Warning: Lesson file not found: {md_path}")
        else:
            print(f"Warning: meta.yaml not found for module {module_dir_name}")

        if os.path.exists(quiz_yaml_path):
            quiz_json_content = convert_quiz_to_quiz_json(quiz_yaml_path, module_title if 'module_title' in locals() else module_dir_name)
            with open(os.path.join(target_module_path, "quiz.json"), "w") as f:
                f.write(quiz_json_content)

if __name__ == "__main__":
    main()
