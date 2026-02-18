# MnTfree Futures Landing

[futures.mntfree.com](https://futures.mntfree.com)용 랜딩 페이지입니다.  
반복을 자동화하고, 시간의 자유를 만드는 **선물 트레이딩 시스템**을 소개합니다.

- 구조·자동화·확률적 사고·리스크 관리를 강조
- 수익 약속 없음, 시스템과 실행 구조 중심

---

## Tech Stack

- **Next.js** 16 (App Router)
- **React** 19, **TypeScript**
- **Tailwind CSS** v4
- **lucide-react** (아이콘)

---

## 로컬 실행

### 사전 요구사항

- Node.js 18+
- npm (또는 yarn / pnpm)

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm run dev
```

### 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 (Turbopack) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과물로 서버 실행 |
| `npm run lint` | ESLint 실행 |

---

## 배포 (GitHub 연동)

이 저장소를 **Vercel**에 연결하면 푸시 시 자동 배포됩니다.

1. [Vercel](https://vercel.com)에 로그인 후 **Add New Project**
2. **Import Git Repository**에서 이 GitHub 저장소 선택
3. Framework Preset: **Next.js** (자동 감지)
4. **Deploy** 후 제공되는 URL을 `futures.mntfree.com`에 연결

또는 Vercel CLI:

```bash
npm i -g vercel
vercel
```

도메인 `futures.mntfree.com`은 Vercel 프로젝트 설정의 **Domains**에서 추가하면 됩니다.

---

## 프로젝트 구조

```
├── app/
│   ├── layout.tsx    # 메타, 폰트, 루트 레이아웃
│   ├── page.tsx      # 단일 랜딩 페이지
│   └── globals.css   # Tailwind + 테마 변수
├── components/
│   ├── Hero.tsx
│   ├── Philosophy.tsx
│   ├── SystemArchitecture.tsx
│   ├── RiskSection.tsx
│   ├── Closing.tsx
│   └── Footer.tsx
└── package.json
```

---

## 라이선스

Private. MnTfree by EVERPRIN.
