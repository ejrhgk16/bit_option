const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('node:process');
const fetch = require('node-fetch');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const rl = readline.createInterface({ input, output });

const domain = 'https://deribit.com'
const url = '/api/v2/public/ticker?instrument_name='

//초기화 하는거 추가해야하고 -- 완
//진행중 출력 -- 완
//명령어 대소문자 소문자로 -- 완
//현재가 입력하지말고 그냥 set할때 api로 가져오자 underlying_price - 완
//테스트 좀하고 빌드

let baseInfo = {
  domain : 'https://deribit.com',
  url : '/api/v2/public/ticker?instrument_name=',
  product : 'BTC',
  price_unit : 1000,
  current_price : 0,
  expire_date_arr : [],
  strike_price_arr : [],
  totalWidth : 50

}

let optionDataObj = {//최종 셋팅한 옵션데이터

}

main()

async function main(){

  printMenu()


  // let current_price = 0
  // let expire_date = ''
  // let strike_price = 0
  // let price_unit = 1000 // 행사가 단위
  // let option_type = 'C' //C - call, P - put

  // let expire_date_arr = []
  // let strike_price_arr = []

  // let product = 'BTC'
  
  let isExit = false



  while(!isExit){

    try {


      const command = (await rl.question(">>> ")).trim().toLowerCase();

      switch (command) {
        case "input1":
          const inputPd = await rl.question("상품명 입력 ::: ");
          baseInfo.product = inputPd

          const inputPU = Number(await rl.question("호가단위 입력 ::: "));
          baseInfo.price_unit = inputPU

          break;
        
        case "input2":
          const inputCP = Number(await rl.question("현재가 입력 ::: "));
          baseInfo.current_price = inputCP
          break;

        case "input3":
          const type = Number(await rl.question("행사가 설정 방식 입력 1(범위로) 2(,로 원하는 행사가 다 입력)::: "));
          let strike_price_arr = []
          if(type ==1 ){
            const inputSP_1 = Number(await rl.question("첫 행사가 입력 ::: "));
            const inputSP_2 = Number(await rl.question("마지막 행사가 입력 ::: "));
            for(let count = inputSP_1; count<=inputSP_2; count = count+baseInfo.price_unit){
              strike_price_arr.push(count)
            }
          }else{
            const inputSP = await rl.question("원하는 행사가 전체 입력 ,으로 구분 ::: ");
            strike_price_arr = inputSP.split(",").map(s => Number(s.trim()));
          }



          // for(let count = 1; count<=15; count++){
          //   const strike_price = current_price - price_unit*count
          //   strike_price_arr.push(strike_price)
          // }

          baseInfo.strike_price_arr = strike_price_arr.sort();
          break;
      
        case "input4":
          const totalWidth = Number(await rl.question("totalWidth 입력 ::: "));
          baseInfo.totalWidth = totalWidth
          break;
        
        case "add1":
          const inputED = (await rl.question("추가할 만기일(expire_date) 입력 ::: ")).trim().toUpperCase();
          baseInfo.expire_date_arr.push(inputED)
          break;
        

        case "set" :
          
          optionDataObj = await setOptionData()
          //console.log("optionDataObj", optionDataObj)
          
          break;

        case "menu":
          printMenu()
          break;

        case "print1":
          // console.log("product : " + product);
          // console.log("current_price : " + current_price);
          // console.log("expire_date_arr", expire_date_arr)
          // console.log("strike_price_arr", strike_price_arr)
          console.log(baseInfo)
          break;

        case "chart":
          printChart();
          break;

        case "reset":
          await reset();
          break;
      
        default:
          break;
      }
    } catch (error) {
      console.log("")
      console.log("error", error)
    }
    //console.log(" ")


  }



}

// const res = await fetch(domain + url +inst)
// const result = await res.json();
// console.log(result)


async function setOptionData(){

  const temp = {} 
  let reqCount = 0

  console.log("진행중 ... ")

  const strike_price_arr = baseInfo.strike_price_arr
  const expire_date_arr = baseInfo.expire_date_arr

  for (const strike_price of strike_price_arr) {
    temp[strike_price] = [];
  
    for (const date of expire_date_arr) {
      // const res_c = await fetch(domain + url + inst); //call put 요청 두번해줘야겟다
      // const result_c = await res.json();

      let optionData = await getOptionData(date, strike_price, reqCount)//특정만기일 특정행사가 데이터 obj
      optionData = Math.round(optionData * 100) / 100;
      // console.log("setOptionData", optionData)

      reqCount += 2

      if(reqCount >=20){
        await sleep(1000)
      }

      //console.log(result_c.result.greeks.gamma)
  
      temp[strike_price].push(optionData);
    }

    
  }

  const returnData = {}

  for(const key in temp){
    const gexArr = temp[key]
    let calGex = 0

    for(const value of gexArr){
      calGex += value
    }
    returnData[key]=calGex
  }

  console.log("완료!")

  return returnData
}


async function getOptionData(expire_date, strike_price, reqCount){//날짜별 행사가별 콜 풋 합친 gex

  // //특정 만기일의 특정 행사가 콜옵션 데이터 요청
  // const inst_c = product+'-'+ expire_date + '-' + strie_price + '-C'
  // const res_c = await fetch(domain + url + inst_c); //call put 요청 두번해줘야겟다
  // const result_c = await res_c.json();

  // //특정 만기일의 특정 행사가 풋옵션 데이터 요청
  // const inst_p = product+ expire_date + '-' + strie_price + '-P'
  // const res_p = await fetch(domain + url + inst_p); 
  // const result_p = await res_p.json();

  const product = baseInfo.product

  const inst_c = product+'-'+ expire_date + '-' + strike_price + '-C'
  const inst_p = product+'-'+ expire_date + '-' + strike_price + '-P'

  //특정 만기일의 특정 행사가의 콜/풋옵션 데이터 요청

  // console.log("expire_date",expire_date)
  // console.log("strike_price",strike_price)

  const [res_c, res_p] = await Promise.all([fetch(domain + url + inst_c), await fetch(domain + url + inst_p)])
  const [result_c, result_p] = await Promise.all([res_c.json(), res_p.json()]);

  // console.log("getOptionData", result_c)

  if(reqCount == 0){
    baseInfo.current_price = result_c.result.underlying_price
  }

  let current_price = baseInfo.current_price

  const gamma_c = result_c.result.greeks.gamma
  const oi_c = result_c.result.open_interest
  const gex_c = gamma_c * oi_c * current_price
  // console.log("current_price" , current_price)
  // console.log(gamma_c,oi_c,gex_c)

  const gamma_p = result_p.result.greeks.gamma
  const oi_p = result_p.result.open_interest
  const gex_p = gamma_p * oi_p * current_price*-1

  const gex_total = gex_c + gex_p

  // const returnData = {
  //   gex_total : gex_total
  // }

  return gex_total

}

function printMenu(){
  console.log("명령어 목록")

  console.log(" input1 :상품명 및 단위 입력 BTC(1000),ETH(100)")
  console.log(" input2 : 현재가입력")
  console.log(" input3 : 행사가 범위 설정")
  console.log(" input4 : 차트출력위치설정")

  console.log(" add1 : expire_date_arr 추가")

  console.log(" set : 옵션데이터 요청후 세팅 ")
  
  console.log(" chart : 차트 출력 ")

  console.log(" menu : 명령어목록 출력 ")

  console.log(" print1 : 현재 입력데이터 출력 ")
}

function printChart(){

  const totalWidth = baseInfo.totalWidth;
  const zeroPos = Math.floor(totalWidth / 2); // 중앙 위치 (0 기준선)

  const sortedKeys = Object.keys(optionDataObj).sort();
  const maxBarLength = 25; // 최대 바 길이 (좌우)

  console.log("optionDataObj" , optionDataObj)

  let maxAbs = 0;
  for (const key of sortedKeys) {
    const value = optionDataObj[key] ?? 0; // gex_total 값 사용
    const absValue = Math.abs(value);
    if (absValue > maxAbs) maxAbs = absValue;
  }
  
  for (const key of sortedKeys) {
    const label = String(key).padEnd(8); // 예: strike_price
    const value = optionDataObj[key] ?? 0;
    const scaledLength = Math.round(Math.abs(value) / maxAbs * maxBarLength);
    // console.log("maxAbs", maxAbs)
    // console.log("scaledLength", scaledLength)
    let bar = '';
    if (value > 0) {
      bar = ' '.repeat(zeroPos) + '|' + '='.repeat(scaledLength);
    } else if (value < 0) {
      bar = ' '.repeat(Math.max(0, zeroPos - scaledLength)) + '='.repeat(scaledLength) + '|';
    } else {
      bar = ' '.repeat(zeroPos) + '|';
    }
  
    console.log(`${label} ${bar} (${value.toFixed(2)})`);
  }

  // const data = [5, 2, 0, -1, -4, 3, -2];
  // const labels = ['Revenue', 'Cost', 'Profit', 'Loss', 'Debt', 'Bonus', 'Penalty'];


  // data.forEach((value, index) => {

  //   const label = labels[index].padEnd(10);

  //   let bar = '';
  //   //value 값이 너무 커지면 단위를 100단위이렇게해야할수도 gex얼마정도 되는지 체크해봐야할듯
  //   if (value > 0) {
  //     bar = ' '.repeat(zeroPos) + '│' + '█'.repeat(value)
  //   } else if (value < 0) {
  //     bar = ' '.repeat(zeroPos + value) + '█'.repeat(-value) + '│';
  //   } else {
  //     bar = ' '.repeat(zeroPos) + '│';
  //   }

  //   console.log(`${label} ${bar} (${value})`);
  // });

}

async function  reset(){
  const command = (await rl.question("초기화를 원하는 변수명 입력, 전체는 all ::: ")).trim().toLowerCase();
  // console.log("reset", command)
  if(command == "all"){
    baseInfo.product = ''
    baseInfo.price_unit = 0
    baseInfo.current_price = 0
    baseInfo.expire_date_arr = []
    baseInfo.strike_price_arr = []
  }else if(command.indexOf("arr") > -1){
    baseInfo[command] = []
  }else if(command == "price_unit" || command == "current_price"){
    baseInfo[command] = 0
  }else{
    baseInfo[command] = ''
  }
}

