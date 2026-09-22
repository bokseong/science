# Science Stock

학교 실험 교구의 보유 수량과 보관 장소를 검색하는 정적 웹사이트입니다. 일반 사용자는 Firestore의 `inventory` 컬렉션을 읽기만 하며, 원본 데이터 수정은 별도의 Google Sheets에서 수행하는 구조를 전제로 합니다.

## 실행

정적 파일이므로 로컬 HTTP 서버 또는 Vercel에서 실행할 수 있습니다.

```powershell
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다. 기본 상태에서는 샘플 데이터가 표시됩니다.

## Firestore 연결

Firebase 프로젝트 `bs-science`가 `config.js`에 연결되어 있습니다. Firestore에 `inventory` 컬렉션을 만들고 아래 필드 구조로 문서를 저장합니다.

```json
{
  "name": "디지털 현미경",
  "category": "생명과학",
  "quantity": 8,
  "location": "과학실 A · 2번장",
  "detail": "USB 연결형 · 500배",
  "updatedAt": "2026-09-22T09:30:00+09:00"
}
```

Firebase 웹 설정값은 클라이언트 식별 정보이며 비밀키 역할을 하지 않습니다. 실제 데이터 보호는 Firestore Security Rules와 인증으로 설정해야 합니다. 보안 규칙은 저장소에 포함하지 않습니다. Firebase 콘솔에서 `inventory` 읽기만 공개하고 모든 클라이언트 쓰기를 차단해야 합니다. GAS는 서버 인증을 사용해 Firestore에 기록해야 합니다.

## Google Sheets → Firestore

GAS 동기화 구현에는 원본 시트의 실제 열 이름과 Firebase 프로젝트 정보가 필요합니다. 다음 매핑이 확정되면 별도로 추가할 수 있습니다.

| Firestore 필드 | 원본 시트 열 |
|---|---|
| `name` | 물품명 |
| `category` | 분류 |
| `quantity` | 보유 수량 |
| `location` | 보관 장소 |
| `detail` | 상세 정보 |
| `updatedAt` | GAS 동기화 시각 |

## 현재 검색 방식

전체 `inventory` 컬렉션을 한 번 읽고 브라우저에서 물품명·분류·장소·상세 정보의 부분 일치를 검색합니다. 소규모 학교 재고에는 단순하고 빠르지만, 데이터가 수천 건 이상이면 검색 전용 필드 또는 별도 검색 서비스가 필요합니다.
