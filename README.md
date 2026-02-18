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

## 배포

### GitHub Pages (권장)

이 프로젝트는 GitHub Pages에 자동 배포되도록 설정되어 있습니다.

#### 초기 설정 (한 번만)

1. GitHub 저장소 **Settings** → **Pages**
2. **Source**: `GitHub Actions` 선택
3. 저장소에 푸시하면 자동으로 배포됩니다

#### 자동 배포

- `main` 브랜치에 푸시하면 GitHub Actions가 자동으로 빌드 및 배포
- 워크플로우: `.github/workflows/deploy.yml`

#### 커스텀 도메인 연결

1. GitHub 저장소 **Settings** → **Pages**
2. **Custom domain**에 `futures.mntfree.com` 입력
3. DNS 설정:
   - **A 레코드**: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - 또는 **CNAME**: `[username].github.io`

#### 수동 배포

```bash
npm run build
# out/ 폴더를 GitHub Pages에 업로드
```

### Vercel (대안)

Vercel을 사용하려면:

1. [Vercel](https://vercel.com)에 로그인 후 **Add New Project**
2. **Import Git Repository**에서 이 GitHub 저장소 선택
3. Framework Preset: **Next.js** (자동 감지)
4. **Deploy**

> **참고**: GitHub Pages 배포를 위해서는 `next.config.ts`에서 `output: "export"`가 설정되어 있습니다. Vercel을 사용할 경우 이 설정을 제거하면 더 나은 성능을 얻을 수 있습니다.

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
