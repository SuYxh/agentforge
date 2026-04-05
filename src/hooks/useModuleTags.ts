import { useMemo } from 'react';
import { usePromptStore } from '@/stores/prompt.store';
import { useSkillStore } from '@/stores/skill.store';
import { getUserSkillTags } from '@/components/skill/skill-modal-utils';

export function useModuleTags(moduleId: string) {
  const promptFilterTags = usePromptStore((s) => s.filterTags);
  const togglePromptFilterTag = usePromptStore((s) => s.toggleFilterTag);
  const clearPromptFilterTags = usePromptStore((s) => s.clearFilterTags);
  const prompts = usePromptStore((s) => s.prompts);

  const skillFilterTags = useSkillStore((s) => s.filterTags);
  const toggleSkillFilterTag = useSkillStore((s) => s.toggleFilterTag);
  const clearSkillFilterTags = useSkillStore((s) => s.clearFilterTags);
  const skills = useSkillStore((s) => s.skills);

  const uniquePromptTags = useMemo(
    () => [...new Set(prompts.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b)),
    [prompts],
  );

  const uniqueSkillTags = useMemo(
    () => [...new Set(skills.flatMap((sk) => getUserSkillTags(sk)))].sort((a, b) => a.localeCompare(b)),
    [skills],
  );

  if (moduleId === 'skills') {
    return {
      tags: uniqueSkillTags,
      filterTags: skillFilterTags,
      toggleFilterTag: toggleSkillFilterTag,
      clearFilterTags: clearSkillFilterTags,
    };
  }

  return {
    tags: uniquePromptTags,
    filterTags: promptFilterTags,
    toggleFilterTag: togglePromptFilterTag,
    clearFilterTags: clearPromptFilterTags,
  };
}
