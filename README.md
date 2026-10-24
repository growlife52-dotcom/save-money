# 야또샀냐

소비 항목과 금액을 넣으면 능청스러운 잼민이가 한마디 하는 모바일 웹앱. AI API 없이 로컬 JSON으로 대사를 선택합니다.

## 실행

Node.js 24 LTS 권장 (Next.js 최소 요구: 20.9 이상).

```bash
npm ci
npm run dev
```

프로덕션 확인:

```bash
npm run build
npm run start
```

별도 서비스나 환경 변수 없이 홈 → 소비 입력 → 결과 → PNG 저장 → 결과 링크 공유 흐름을 사용할 수 있습니다. 공유 링크는 배포된 동일 도메인에서 열어야 합니다. 로컬 주소는 다른 사람에게 공유할 수 없습니다.

## 구현

- Next.js App Router · TypeScript · Tailwind CSS 4 · Motion
- Pretendard 가변 폰트 자체 호스팅 (외부 CDN 요청 없음)
- 오리지널 SVG 캐릭터 표정 4종: 능청, 웃음, 놀람, 인정
- 초기 제스처 3종: 턱 괴고 고민하기, 턱 만지며 능청 웃기, 검지 들기. 표정별 검증 조합 7개를 추가하고, 인정 대사는 기본 자세 유지
- 대사별 허용 제스처에서 무작위 선택. 가능한 경우 직전 제스처 제외. 홈 캐릭터는 접속·초기화 때만 선택하고 입력 중에는 고정
- v2 결과에 characterId 저장. 화면·공유 PNG·공유 링크·DB에서 같은 캐릭터 사용. 기존 v1 결과는 기존 표정의 기본 자세로 복원
- 제스처 등장 모션은 한 번만 실행하며 동작 줄이기 설정을 존중
- `src/data/lines.json`: 카테고리·금액 조건별 대사 28개
- `src/lib/judge.ts`: 키워드 분류, 금액 검증, 후보 내 중복 방지, 공유 데이터 검증
- 입력: 항목 최대 40자, 1–999,999,999원 정수; 금액 쉼표 자동 표시
- 대사 후보를 모두 사용하기 전에는 재사용하지 않고, 소진 후에도 직전 대사를 피합니다. 기록은 브라우저에 최대 100개 보관하며 저장소가 차단되어도 재심판의 즉시 반복은 방지합니다.
- Canvas PNG: 1080×1920 고정, 버튼·입력창 제외. 폰트와 SVG 로딩 후 생성
- 지원 브라우저에서는 파일 공유 시트, 그 외에는 PNG 다운로드. 인스타그램 업로드는 사용자가 직접 진행합니다.
- 기본 결과 링크: 검증된 결과를 URL에 포함 (암호화 아님). 새로고침과 다른 브라우저에서 동일 결과 복원
- Supabase 설정 시: 서버에서 결과를 저장하고 `/s/:uuid` 링크 생성. DB 장애를 저장 성공으로 표시하지 않습니다.
- 공유된 URL의 대사 ID는 배포 이후에도 유지하세요. 대사를 삭제하면 기존 링크가 무효해질 수 있습니다.
- 키보드 포커스, 공유 모달 포커스 유지·닫기, 오류 알림, 동작 줄이기 설정 지원

## Supabase 연결

1. 기존 Supabase 프로젝트 SQL Editor에서 `supabase/schema.sql`을 실행합니다. `shared_results` 테이블은 RLS를 켜고 익명·일반 사용자 접근을 차단합니다.
2. `.env.example`을 `.env.local`로 복사하고 **로컬 파일 또는 배포 서비스의 보안 환경 변수 설정**에 값을 넣습니다. 키를 커밋하거나 채팅으로 보내지 마세요.

| 변수 | 용도 |
| --- | --- |
| `SUPABASE_URL` | 프로젝트 API URL (`https://프로젝트.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 service_role 키. `NEXT_PUBLIC_` 접두사 금지 |

3. 서버를 재시작하고 결과에서 ‘스토리 박제하기 → 결과 링크 복사하기’를 누릅니다.
4. `/s/UUID` 형태의 링크를 새 브라우저에서 열고, 테이블에 결과가 저장되었는지 확인합니다.

두 변수가 모두 없을 때는 URL 포함형 공유로 동작합니다. 한 변수만 설정한 경우는 설정 오류로 처리합니다. 기존 공유 링크에 구매 항목·금액이 포함되므로 개인정보를 입력하지 마세요. 사용자가 ‘결과 링크 복사하기’를 눌렀을 때만 DB 저장을 요청합니다. 실제 운영 전에는 Supabase 사용량 제한과 Vercel 방화벽의 요청 제한을 설정하고, 데이터 보관·삭제 정책을 정하세요.

## 검증

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

E2E는 프로덕션 서버를 자동 시작하고 시스템 Chromium을 사용합니다. 다른 머신에서는 Chromium을 설치하고 `CHROMIUM_PATH`를 지정하거나 Playwright 설정의 실행 경로를 조정하세요. 테스트는 **Supabase 미설정 환경**에서 URL 포함형 공유를 검증합니다. 실제 Supabase 읽기·쓰기 검증은 프로젝트 연결 후 별도로 진행해야 합니다.

단위 테스트: 분류·금액 경계·중복 방지·잘못된 입력·한글/이모지 공유 복원.
브라우저 테스트: 입력 오류·금액 포맷·결과·재심판·새로고침·공유 PNG 규격·링크 복원·320–1440px 가로 넘침·잘못된 링크/API 요청 거절.

## Vercel 배포

1. 이 저장소를 GitHub에 푸시한 뒤 Vercel에서 **Add New → Project**로 가져옵니다. 또는 Vercel CLI 인증 후 프로젝트 폴더에서 `npx vercel`로 미리보기를 배포합니다.
2. Framework는 Next.js, Root Directory는 저장소 루트, Install은 `npm ci`, Build는 `npm run build`를 사용합니다.
3. Supabase 사용 시 위의 두 서버 환경 변수를 Preview와 Production에 각각 설정하고 SQL을 적용합니다. 키는 클라이언트 번들에 넣지 않습니다.
4. Preview에서 모바일 입력 → 재심판 → PNG 저장 → 링크를 다른 브라우저에서 열기까지 확인합니다.
5. 검증 후 Production으로 배포합니다. 배포된 HTTPS 주소에서 iOS Safari·Android Chrome의 PNG 저장 및 인스타 스토리 업로드를 실기기로 확인하세요.

현재 저장소에는 배포 인증 정보가 없습니다. 실제 Vercel 배포, Supabase 원격 읽기·쓰기, 실기기의 인스타 업로드는 로컬 브라우저 테스트와 별개입니다.

## 디자인 및 자산

제공된 텍스트 디자인 기준으로 제작했습니다. 확정 9:16 시안 원본이 제공되면 세부 치수·캐릭터 아트 방향을 맞출 수 있습니다. 캐릭터는 `public/character-*.svg`, 폰트 라이선스는 `public/fonts/Pretendard-LICENSE.txt`에 있습니다.

## 제스처 데이터 유지

`src/lib/characters.ts`에서 표정·제스처 조합과 자산 경로를 관리하고, `src/data/lines.json`의 `gestures`로 대사별 허용 후보를 지정합니다. 기존 조합 ID와 자산은 공유 링크 호환성을 위해 유지하세요. 배 잡고 웃기·두 손 들기·엄지 들기는 다음 단계 범위입니다.

저장된 JSON은 v1과 v2를 모두 지원합니다. 최초 안내에 따라 생성한 Supabase 테이블은 별도 변경 없이 v2 결과를 저장합니다. 이전 버전의 `schema.sql`을 직접 적용해 `valid_verdict` 제약조건이 있는 DB라면 다음 SQL로 버전 검사만 확장하세요.

```sql
alter table public.shared_results drop constraint if exists valid_verdict;
alter table public.shared_results add constraint valid_verdict check (
  jsonb_typeof(verdict) = 'object'
  and verdict ?& array['version','item','amount','lineId']
  and (verdict->>'version') in ('1','2')
  and char_length(verdict->>'item') between 1 and 40
  and (verdict->>'amount')::numeric between 1 and 999999999
);
```

현재 연결된 Supabase에서는 v2 결과 저장과 characterId 복원을 검증했습니다.

## 사진 캐릭터

기존 일러스트 대신 사용자가 제공한 남자아이 사진 세 가지를 배경 제거한 이미지로 표시합니다. 고민하기·능청 웃기·검지 들기를 상황별로 선택하며, 기존 characterId는 유지합니다. 과거 결과도 해당 자세의 사진으로 표시됩니다. 기본 자세는 표정에 맞춰 능청 웃기 또는 검지 들기 사진을 사용합니다.

`public/character-photo-*.svg`는 투명 PNG를 포함하는 정사각형 자산입니다. 결과 화면과 PNG 생성은 같은 자산을 사용합니다. 사진에 존재하는 워터마크는 유지합니다. 기존 SVG 일러스트 파일은 이전 버전과의 자산 호환성을 위해 보관하되 앱에서는 선택하지 않습니다.

## 현재 심판 사진 구성

홈 화면은 두 번째 제공 사진인 검지를 든 남자아이(`judge-boy`)로 고정합니다. 입력·초기화·새로고침에도 같은 인물을 표시합니다.

심판 결과는 소비 카테고리와 무관하게 다음 세 인물에서 무작위로 선택합니다. 대사 선택은 기존 카테고리·금액 조건을 유지하고 인물만 별도로 선택합니다. 직전과 같은 인물은 피하며, 선택된 ID는 결과·PNG·공유 링크에 고정합니다.

- `judge-wallet`: 빈 지갑을 보여주는 남자
- `judge-boy`: 검지를 든 남자아이
- `judge-shrug`: 양손을 펼친 남자

최신 자산은 `public/judge-*.svg`이며 배경을 제거한 사진을 포함합니다. 과거 v1·v2 링크도 지원하고 이전 인물 ID는 새 사진에 대응시킵니다. 위의 예전 사진/제스처 설명보다 이 구성 설명을 우선합니다.
