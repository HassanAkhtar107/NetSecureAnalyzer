import os
import re

root_dir = r"d:\Net Secure Analyzer\frontend\src"

def clean_content(content):
    # Remove 'type' in imports: import { a, type B } -> import { a }
    content = re.sub(r'import\s+\{([^}]*)\}\s+from', lambda m: 'import {' + re.sub(r'type\s+\w+,?\s*', '', m.group(1)).strip(', ') + '} from', content)
    
    # Remove interfaces
    content = re.sub(r'export interface \w+\s*(?:extends\s+[\w\.<>,\s]+)?\s*\{[\s\S]*?\}', '', content)
    content = re.sub(r'interface \w+\s*(?:extends\s+[\w\.<>,\s]+)?\s*\{[\s\S]*?\}', '', content)
    
    # Remove types
    content = re.sub(r'export type \w+\s*=\s*[\s\S]*?;', '', content)
    content = re.sub(r'type \w+\s*=\s*[\s\S]*?;', '', content)
    
    # Remove generic constraints in forwardRef
    content = re.sub(r'React\.forwardRef<[^>]*>', 'React.forwardRef', content)
    content = re.sub(r'forwardRef<[^>]*>', 'forwardRef', content)
    
    # Remove type annotations from parameters
    content = re.sub(r'(\w+):\s*[A-Z][\w\.<>\[\]]*(?=\s*[\),=])', r'\1', content)
    
    # Remove generic brackets like <T>
    content = re.sub(r'(?<=\w)<[A-Z][\w\.<>,\s]*>', '', content)
    
    # Remove 'as string', 'as any', etc.
    content = re.sub(r'\s+as\s+[A-Z][\w\.<>\[\]]*', '', content)
    
    # Final cleanup of double commas in imports
    content = content.replace(', ,', ',').replace('{ ,', '{').replace(', }', '}')
    
    # Repair broken React imports
    content = content.replace('import * from "react"', 'import * as React from "react"')
    content = content.replace('import * from \'react\'', 'import * as React from \'react\'')
    
    return content

for root, dirs, files in os.walk(root_dir):
    for filename in files:
        if filename.endswith(".jsx") or filename.endswith(".js"):
            path = os.path.join(root, filename)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = clean_content(content)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
            except Exception as e:
                print(f"Error processing {path}: {e}")

print("Done")
