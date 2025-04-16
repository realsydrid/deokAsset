import {useEffect, useState, useRef} from 'react'
import {
    formatDecimalsWithCommas,
    formatMillionsWithCommas,
    formatPercentWithDecimals
} from "../src/numberFormat.js"
import './App.css'
import {useQuery} from "@tanstack/react-query";
import profileImage from './assets/KakaoTalk_Photo_2025-04-16-19-27-18.jpeg';

// API 환경 설정
const API_URL = "https://api.coinone.co.kr/public/v2/ticker_new/KRW/GM";

// 여러 CORS 프록시 URL (순서대로 시도)
const PROXY_URLS = [
    `https://api.codetabs.com/v1/proxy?quest=${API_URL}`,
    `https://corsproxy.io/?${encodeURIComponent(API_URL)}`,
    `https://corsproxy.org/?${encodeURIComponent(API_URL)}`
];

function App() {
    const [coinPrice, setCoinPrice] = useState(null)
    const [highlight, setHighlight] = useState(false)
    const prevPriceRef = useRef(null)
    const [lastUpdated, setLastUpdated] = useState(new Date())
    const proxyIndexRef = useRef(0)
    
    // API 호출 함수 - 여러 CORS 프록시 순차 시도
    const fetchData = async () => {
        // 현재 시도할 프록시 인덱스
        const currentProxyIndex = proxyIndexRef.current;
        const proxyUrl = PROXY_URLS[currentProxyIndex];
        
        console.log(`[${new Date().toLocaleTimeString()}] API 요청(프록시 ${currentProxyIndex + 1}/${PROXY_URLS.length}):`, proxyUrl);
        
        try {
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 응답 오류 확인
            if (data.result === 'error') {
                console.warn(`API 오류 응답: ${data.error_code} - ${data.error_msg}`);
                throw new Error(`API 오류: ${data.error_msg}`);
            }
            
            // 성공 시 다음에도 같은 프록시 사용
            console.log(`[${new Date().toLocaleTimeString()}] API 성공 (프록시 ${currentProxyIndex + 1})`);
            setLastUpdated(new Date());
            return data;
        } catch (error) {
            // 다음 프록시 시도
            proxyIndexRef.current = (currentProxyIndex + 1) % PROXY_URLS.length;
            console.error(`프록시 ${currentProxyIndex + 1} 실패, 다음 프록시 시도 예정`, error);
            throw new Error(`API 요청 실패: ${error.message}`);
        }
    };
    
    const {data:apiData, isLoading, error} = useQuery({
        queryKey:["apiData"],
        staleTime: 0,
        retry: 3, // 재시도 증가 (다른 프록시 시도를 위해)
        retryDelay: 1000, // 1초 후 재시도
        refetchInterval: 1000,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
        queryFn: fetchData
    });
    
    useEffect(() => {
        if (apiData) {
            // API 응답 구조에 맞게 수정
            const currentPrice = apiData?.tickers?.[0]?.last;
            const prevPrice = prevPriceRef.current;
            
            // 이전 가격이 있고, 현재 가격이 이전 가격과 다를 경우 하이라이트 효과 적용
            if (prevPrice !== null && currentPrice !== prevPrice) {
                setHighlight(true);
                
                // 1.5초 후 하이라이트 효과 제거 (애니메이션 시간과 일치)
                setTimeout(() => {
                    setHighlight(false);
                }, 1500);
            }
            
            // 현재 가격을 이전 가격으로 저장
            prevPriceRef.current = currentPrice;
            setCoinPrice(apiData);
        }
    }, [apiData]);
    
    // 데이터가 로드되었는지 확인
    const isDataLoaded = coinPrice && coinPrice.tickers && coinPrice.tickers[0]?.last;
    
    return (
        <>
            <div className="profile-container">
                <img src={profileImage} alt="프로필 이미지" className="profile-image" />
            </div>
            
            <div className="content-wrapper">
                {isLoading && <p>데이터 로딩 중...</p>}
                {error && <p>실시간 데이터 로딩 오류</p>}
                {isDataLoaded && (
                    <>
                        <p className={highlight ? 'highlight' : ''}>
                            <span>곰블코인 현재가격: </span>
                            <span>{coinPrice.tickers[0].last}</span>
                        </p>
                        <p className={highlight ? 'highlight' : ''}>
                            <span>임덕균 4년 옵션 자산: </span>
                            <span>{formatDecimalsWithCommas(Number(coinPrice.tickers[0].last) * 3000000, 2)} 원</span>
                        </p>
                        <p className={highlight ? 'highlight' : ''}>
                            <span>오늘 받는 보너스: </span>
                            <span>{formatDecimalsWithCommas(Number(coinPrice.tickers[0].quote_volume) / Number(coinPrice.tickers[0].target_volume) * 150000, 0)} 원</span>
                        </p>
                        <hr/>
                        <p className={highlight ? 'highlight' : ''}>
                            <span>거래금액: </span>
                            <span>{formatDecimalsWithCommas(Number(coinPrice.tickers[0].quote_volume))} 원</span>
                        </p>
                        <p className={highlight ? 'highlight' : ''}>
                            <span>거래량 : </span>
                            <span>{formatDecimalsWithCommas(Number(coinPrice.tickers[0].target_volume))} GM</span>
                        </p>
                        <p>
                            <small>
                                최종 업데이트: {lastUpdated.toLocaleTimeString()} (실시간 API)
                            </small>
                        </p>
                    </>
                )}
            </div>
        </>
    )
}

export default App
