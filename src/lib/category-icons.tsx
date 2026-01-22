import {
  Code,
  Palette,
  Music,
  Dumbbell,
  Globe,
  ChefHat,
  Camera,
  Briefcase,
  Theater,
  Gamepad2,
  BookOpen,
  Sparkles,
  Shirt,
  GraduationCap,
  Landmark,
  Home,
  MoreHorizontal,
  LucideIcon,
} from 'lucide-react';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  programming: Code,
  design: Palette,
  music: Music,
  sports: Dumbbell,
  language: Globe,
  cooking: ChefHat,
  media: Camera,
  business: Briefcase,
  art: Theater,
  gaming: Gamepad2,
  study: BookOpen,
  beauty: Sparkles,
  fashion: Shirt,
  career: GraduationCap,
  traditional: Landmark,
  lifestyle: Home,
  other: MoreHorizontal,
};

export function getCategoryIcon(slug: string): LucideIcon {
  return CATEGORY_ICONS[slug] || MoreHorizontal;
}
