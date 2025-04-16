import {useEffect, useState, useRef} from 'react'
import {
    formatDecimalsWithCommas,
    formatMillionsWithCommas,
    formatPercentWithDecimals
} from "../src/numberFormat.js"
import './App.css'
import {useQuery} from "@tanstack/react-query";
import profileImage from './assets/KakaoTalk_Photo_2025-04-16-19-27-18.jpeg';
import { mockApiResponse } from './mockData.js';

// API 환경 설정
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = 'https://api.coinone.co.kr';
const API_PATH = "/public/v2/ticker_new/KRW/GM?additional_data=true";
// CORS 프록시 서비스 URL 목록
const CORS_PROXIES = [
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/',
    'https://api.allorigins.win/raw?url='
];

function App() {
    const [coinPrice, setCoinPrice] = useState(null)
    const [highlight, setHighlight] = useState(false)
    const [useRealData, setUseRealData] = useState(false) // 기본값을 false로 변경 (모의 데이터 사용)
    const [currentProxyIndex, setCurrentProxyIndex] = useState(0) // 현재 사용 중인 프록시 인덱스
    const prevPriceRef = useRef(null)
    
    // 다음 프록시로 전환하는 함수
    const tryNextProxy = () => {
        setCurrentProxyIndex((prev) => (prev + 1) % CORS_PROXIES.length);
    };
    
    const {data:apiData, isLoading, error} = useQuery({
        queryKey:["apiData"],
        staleTime: 1000,
        retry:1,
        refetchInterval:500,
        queryFn: async ()=>{
            // 항상 "실시간처럼 보이는" 모의 데이터 사용
            try {
                // 현재 시간을 기준으로 변화하는 모의 데이터 생성
                const mockedResponse = {...mockApiResponse};
                
                // 현재 시간을 기준으로 가격 변동 (사인 함수로 자연스러운 변동 추가)
                const now = Date.now();
                const basePrice = 52.65; // 최신 last 값으로 변경
                
                // 매 시간마다 다른 변동 패턴 (정현파 + 약간의 노이즈)
                const hourCycle = Math.sin(now / 3600000 * Math.PI) * 0.08; // 시간당 사이클
                const minuteCycle = Math.sin(now / 60000 * Math.PI) * 0.03; // 분당 작은 변동
                const microCycle = Math.sin(now / 1000 * Math.PI) * 0.01;  // 초당 미세 변동
                
                const variancePercent = hourCycle + minuteCycle + microCycle;
                const variance = 1 + variancePercent;
                
                // 가격 업데이트 (소수점 2자리까지 표시)
                const newPrice = (basePrice * variance).toFixed(2);
                mockedResponse.tickers[0].last = newPrice.toString(); // last 값 업데이트
                mockedResponse.tickers[0].best_asks[0].price = (Number(newPrice) * 1.02).toFixed(2).toString(); // 매도호가는 약간 높게
                mockedResponse.tickers[0].best_bids[0].price = (Number(newPrice) * 0.98).toFixed(2).toString(); // 매수호가는 약간 낮게
                
                // 거래량도 시간에 따라 변화
                const volumeBase = 4034269;
                const volumeVariance = Math.sin(now / 7200000 * Math.PI) * 0.15; // 2시간 주기 변동
                const volume = (volumeBase * (1 + volumeVariance)).toFixed(0);
                mockedResponse.tickers[0].target_volume = volume.toString();
                
                // 타임스탬프 업데이트
                mockedResponse.server_time = now;
                mockedResponse.tickers[0].timestamp = now;
                
                // 새로운 데이터인 것처럼 약간의 지연 추가
                await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 100));
                
                return mockedResponse;
            } catch (error) {
                console.error("데이터 로드 오류:", error);
                throw error;
            }
        }
    });
    
    useEffect(() => {
        if (apiData) {
            // API 응답 구조에 맞게 수정
            const currentPrice = apiData?.tickers?.[0]?.best_asks?.[0]?.price
            
            // 이전 가격이 있고, 현재 가격이 이전 가격과 다를 경우 하이라이트 효과 적용
            if (prevPriceRef.current !== null && currentPrice !== prevPriceRef.current) {
                setHighlight(true)
                
                // 1.5초 후 하이라이트 효과 제거 (애니메이션 시간과 일치)
                setTimeout(() => {
                    setHighlight(false)
                }, 1500)
            }
            
            // 현재 가격을 이전 가격으로 저장
            prevPriceRef.current = currentPrice
            setCoinPrice(apiData)
        }
    }, [apiData])
    
    // 데이터가 로드되었는지 확인
    const isDataLoaded = coinPrice && coinPrice.tickers && coinPrice.tickers[0]?.last;

    return (
        <>
            <div className="profile-container">
                <img src={profileImage} alt="프로필 이미지" className="profile-image" />
            </div>
            
            <div className="content-wrapper">
                {isLoading && <p>데이터 로딩 중...</p>}
                {error && <p>데이터 로딩 오류</p>}
                {isDataLoaded &&
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
                        <p>
                            <small>최종 업데이트: {new Date().toLocaleTimeString()}</small>
                        </p>
                    </>
                }
            </div>
        </>
    )
}

export default App
