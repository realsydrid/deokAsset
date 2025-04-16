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
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = 'https://api.coinone.co.kr';
const API_PATH = "/public/v2/ticker_new/KRW/GM?additional_data=true";

function App() {
    const [coinPrice, setCoinPrice] = useState([])
    const [highlight, setHighlight] = useState(false)
    const prevPriceRef = useRef(null)
    
    const {data:apiData, isLoading, error} = useQuery({
        queryKey:["apiData"],
        staleTime: 1000,
        retry:1,
        refetchInterval:1000,
        queryFn: async ()=>{
            // 개발 환경에서는 프록시를, 프로덕션 환경에서는 직접 URL 사용
            const URL = isDev 
                ? `/api${API_PATH}`  // 개발 환경: Vite 프록시 사용
                : `${API_BASE_URL}${API_PATH}`; // 프로덕션 환경: 직접 API 호출
            
            try {
                await new Promise(resolve => setTimeout(resolve, 0));
                const res = await fetch(URL, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    }
                });
                if (!res.ok) throw new Error(res.status + "");
                return res.json();

            } catch (error) {
                console.error("API 호출 오류:", error);
                throw new Error(error);
            }
        }
    });
    
    useEffect(() => {
        if (apiData) {
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

    return (
        <>
            <div className="profile-container">
                <img src={profileImage} alt="프로필 이미지" className="profile-image" />
            </div>
            
            <div className="content-wrapper">
                {coinPrice && coinPrice.tickers && coinPrice.tickers[0].best_asks &&
                    <>
                        <p className={highlight ? 'highlight' : ''}>
                            <span>임덕균 4년 옵션 자산: </span>
                            <span>{formatDecimalsWithCommas(coinPrice?.tickers?.[0]?.best_asks?.[0]?.price*3000000,2)} 원</span>
                        </p>
                        <p className={highlight ? 'highlight' : ''}>
                            <span>오늘 받는 보너스: </span>
                            <span>{formatDecimalsWithCommas(coinPrice?.tickers?.[0].quote_volume/coinPrice?.tickers?.[0].target_volume*150000, 0)} 원</span>

                        </p>
                        <p className={highlight ? 'highlight' : ''}>
                            <span>실시간 평균체결금액: </span>
                            <span>{formatDecimalsWithCommas(coinPrice?.tickers?.[0].quote_volume/coinPrice?.tickers?.[0].target_volume, 2)} 원</span>
                        </p>
                    </>
                }
            </div>
        </>
    )
}

export default App
