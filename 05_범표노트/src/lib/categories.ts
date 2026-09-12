// 카테고리 정의: 이름(프론트매터에 쓰는 값) / slug(주소창에 쓰이는 영문) / 설명
export interface Category {
  name: string;
  slug: string;
  description: string;
}

export const categories: Category[] = [
  {
    name: '커피 수다',
    slug: 'coffee-talk',
    description: '커피에 관한 이런저런 이야기. 기본적으로 공개.',
  },
  {
    name: '가맹점 이야기',
    slug: 'franchise',
    description: '가맹점과 관련된 소식. 기본적으로 공개.',
  },
  {
    name: '입점 이야기',
    slug: 'market-entry',
    description: '스마트스토어·카페24 등 입점 관련 이야기. 기본적으로 공개.',
  },
  {
    name: '프로젝트 이야기',
    slug: 'projects',
    description: 'AI와 함께 만든 것들에 대한 이야기. 기본적으로 공개.',
  },
  {
    name: '일기',
    slug: 'diary',
    description: '개인적인 기록. 공개 여부는 글마다 직접 확인 필요(기본은 공개이나 개인적인 내용은 public: false 권장).',
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getCategoryByName(name: string): Category | undefined {
  return categories.find((c) => c.name === name);
}
