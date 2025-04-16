// 코인원 API 응답을 시뮬레이션하는 모의 데이터
export const mockApiResponse = {
  "result": "success",
  "error_code": "0",
  "server_time": Date.now(),
  "tickers": [
    {
      "quote_currency": "krw",
      "target_currency": "gm",
      "timestamp": Date.now(),
      "high": "97.0",
      "low": "40.51",
      "first": "85.6",
      "last": "54.4",
      "quote_volume": "224909714.1755",
      "target_volume": "4034269.03089779",
      "best_asks": [
        {
          "price": "61.8",
          "qty": "10298.34531423"
        }
      ],
      "best_bids": [
        {
          "price": "51.05",
          "qty": "3568.708315"
        }
      ],
      "id": Date.now().toString(), 
      "yesterday_high": "85.86",
      "yesterday_low": "85.86",
      "yesterday_first": "85.86",
      "yesterday_last": "85.86",
      "yesterday_quote_volume": "0.0",
      "yesterday_target_volume": "0.0"
    }
  ]
}; 