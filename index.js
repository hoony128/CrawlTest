

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const xlsx  = require("xlsx");

const excelFile = xlsx.readFile("input.xls");
const sheetName = excelFile.SheetNames[0];
const firstSheet = excelFile.Sheets[sheetName];
const allVal = xlsx.utils.sheet_to_json( firstSheet, { defval : "" } );

//CDH

let excelData = [["URL","NAME","MSG"]];


let gbn = process.argv[2];
let param = "https://contract.seoul.go.kr/";

if(typeof gbn != "undefined")
{
	param +=  gbn
}

(async () => {
	const browser = await puppeteer.launch({
		headless : false 
		,targetFilter: (target) => target.type() !== 'other' || !!target.url()
	});

	const page = await browser.newPage();
	// 페이지의 크기를 설정한다.2
	await page.setViewport({
	width: 1366,
	height: 768
	});
	  
	if( typeof gbn != "undefined")
	{	
		crwalExcute(page,param,process.argv[3]);	
	}else
	{	
		for(let i = 0 ; i < allVal.length;i++)
		{
			await crwalExcute(page,allVal[i].URL,allVal[i].NM);	
			await new Promise((page) => setTimeout(page, 1000));
		}
	}
	  // 브라우저를 종료한다.
	browser.close();	
	
	const data = xlsx.utils.book_new();	  
	const errMsg = xlsx.utils.aoa_to_sheet(excelData);	
	xlsx.utils.book_append_sheet( data, errMsg, "ErrMsg" );
	xlsx.writeFile( data, "result.xlsx" ); 
})();



async function crwalExcute(page,val,valNm)
{	  
	await page.goto('https://validator.w3.org/nu/?doc='+val);
	//await new Promise((page) => setTimeout(page, 5000));
	await page.waitForSelector("ol")

	// 페이지의 HTML을 가져온다.
	const content = await page.content();
	// $에 cheerio를 로드한다.
	const $ = cheerio.load(content);
	// 복사한 리스트의 Selector로 리스트를 모두 가져온다.
	const lists = $("#results > ol > li.error");
	const lists2 = $("#results > ol > li.non-document-error");
	$(".location").remove();
	// 모든 리스트를 순환한다.

	lists.each((index, list) => {
		excelData.push([val,valNm, $(list).text()]);
	});
	
	lists2.each((index, list) => {
		excelData.push([val,valNm, "검출실패"]);
	});
	
	if(lists.length >0 )
	{		
		console.log( (typeof valNm != "undefined" ? valNm+"( " + val + ")" : val)+"\t :"+ "Err 총 "+ (lists.length) + "건이 검출되었습니다.");
	}
	if(lists2.length >0 )
	{		
		console.log( (typeof valNm != "undefined" ? valNm+"( " + val + ")" : val)+"\t :"+ "검출실패[주소확인필요]");
	}
	
}
