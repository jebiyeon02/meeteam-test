export type TeammateRole =
  | '프론트엔드'
  | '백엔드'
  | '디자이너'
  | 'PM/기획'
  | '마케팅'
  | 'AI'
  | '인프라/운영'
  | '기타';

export type Teammate = {
  id: number;
  name: string;
  role: TeammateRole;
  experienceCount: number;
  skills: string[];
  imageUrl: string;
};
