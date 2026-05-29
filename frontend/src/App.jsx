import { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceDot
} from 'recharts';
import './App.css';

// ─── Static area-type lookup (mirrors your Python scripts) ──────────────────
const URBAN     = ['Koregaon Park','Viman Nagar','Kothrud','Shivaji Nagar','Baner','Kharadi','Aundh'];
const SEMIURBAN = ['Wakad','Hadapsar','Magarpatta','Balewadi','Hinjewadi','Pimpri','Yerwada'];

function getAreaType(loc) {
  if (URBAN.includes(loc))     return 'Urban';
  if (SEMIURBAN.includes(loc)) return 'SemiUrban';
  return 'Rural';
}

// ─── Pre-computed average price lookup table (from dataset) ─────────────────
const PRICE_DATA = {"area":{"Urban|1|Furnished|Rent|None":32926,"Urban|1|Furnished|Buy|New":8631026,"Urban|1|Furnished|Buy|PreOwned":7091006,"Urban|1|Non-Furnished|Rent|None":25520,"Urban|1|Non-Furnished|Buy|New":7701876,"Urban|1|Non-Furnished|Buy|PreOwned":6135888,"Urban|2|Furnished|Rent|None":53647,"Urban|2|Furnished|Buy|New":13653824,"Urban|2|Furnished|Buy|PreOwned":12055107,"Urban|2|Non-Furnished|Rent|None":45558,"Urban|2|Non-Furnished|Buy|New":12666361,"Urban|2|Non-Furnished|Buy|PreOwned":11181276,"Urban|3|Furnished|Rent|None":77999,"Urban|3|Furnished|Buy|New":20683349,"Urban|3|Furnished|Buy|PreOwned":19069549,"Urban|3|Non-Furnished|Rent|None":70712,"Urban|3|Non-Furnished|Buy|New":19677044,"Urban|3|Non-Furnished|Buy|PreOwned":18137417,"Urban|4|Furnished|Rent|None":128041,"Urban|4|Furnished|Buy|New":28767848,"Urban|4|Furnished|Buy|PreOwned":26996514,"Urban|4|Non-Furnished|Rent|None":120426,"Urban|4|Non-Furnished|Buy|New":27652426,"Urban|4|Non-Furnished|Buy|PreOwned":26091541,"Urban|5|Furnished|Rent|None":187709,"Urban|5|Furnished|Buy|New":42548327,"Urban|5|Furnished|Buy|PreOwned":41138474,"Urban|5|Non-Furnished|Rent|None":180559,"Urban|5|Non-Furnished|Buy|New":41605626,"Urban|5|Non-Furnished|Buy|PreOwned":40111250,"SemiUrban|1|Furnished|Rent|None":25512,"SemiUrban|1|Furnished|Buy|New":6664365,"SemiUrban|1|Furnished|Buy|PreOwned":5171819,"SemiUrban|1|Non-Furnished|Rent|None":18410,"SemiUrban|1|Non-Furnished|Buy|New":5765381,"SemiUrban|1|Non-Furnished|Buy|PreOwned":4154425,"SemiUrban|2|Furnished|Rent|None":37747,"SemiUrban|2|Furnished|Buy|New":10090577,"SemiUrban|2|Furnished|Buy|PreOwned":8541480,"SemiUrban|2|Non-Furnished|Rent|None":30657,"SemiUrban|2|Non-Furnished|Buy|New":9091905,"SemiUrban|2|Non-Furnished|Buy|PreOwned":7652964,"SemiUrban|3|Furnished|Rent|None":58235,"SemiUrban|3|Furnished|Buy|New":15664694,"SemiUrban|3|Furnished|Buy|PreOwned":14206886,"SemiUrban|3|Non-Furnished|Rent|None":50361,"SemiUrban|3|Non-Furnished|Buy|New":14742160,"SemiUrban|3|Non-Furnished|Buy|PreOwned":13173252,"SemiUrban|4|Furnished|Rent|None":93323,"SemiUrban|4|Furnished|Buy|New":22632661,"SemiUrban|4|Furnished|Buy|PreOwned":21045779,"SemiUrban|4|Non-Furnished|Rent|None":85300,"SemiUrban|4|Non-Furnished|Buy|New":21700865,"SemiUrban|4|Non-Furnished|Buy|PreOwned":20142171,"SemiUrban|5|Furnished|Rent|None":137505,"SemiUrban|5|Furnished|Buy|New":32719628,"SemiUrban|5|Furnished|Buy|PreOwned":31097183,"SemiUrban|5|Non-Furnished|Rent|None":130611,"SemiUrban|5|Non-Furnished|Buy|New":31795854,"SemiUrban|5|Non-Furnished|Buy|PreOwned":30127781,"Rural|1|Furnished|Rent|None":19133,"Rural|1|Furnished|Buy|New":5082348,"Rural|1|Furnished|Buy|PreOwned":3677892,"Rural|1|Non-Furnished|Rent|None":12552,"Rural|1|Non-Furnished|Buy|New":4053940,"Rural|1|Non-Furnished|Buy|PreOwned":2596236,"Rural|2|Furnished|Rent|None":28338,"Rural|2|Furnished|Buy|New":7652664,"Rural|2|Furnished|Buy|PreOwned":6159371,"Rural|2|Non-Furnished|Rent|None":20418,"Rural|2|Non-Furnished|Buy|New":6748594,"Rural|2|Non-Furnished|Buy|PreOwned":5196980,"Rural|3|Furnished|Rent|None":42959,"Rural|3|Furnished|Buy|New":11135165,"Rural|3|Furnished|Buy|PreOwned":9754412,"Rural|3|Non-Furnished|Rent|None":35696,"Rural|3|Non-Furnished|Buy|New":10072100,"Rural|3|Non-Furnished|Buy|PreOwned":8705295,"Rural|4|Furnished|Rent|None":68899,"Rural|4|Furnished|Buy|New":16634803,"Rural|4|Furnished|Buy|PreOwned":15093788,"Rural|4|Non-Furnished|Rent|None":60681,"Rural|4|Non-Furnished|Buy|New":15750888,"Rural|4|Non-Furnished|Buy|PreOwned":14211908,"Rural|5|Furnished|Rent|None":103209,"Rural|5|Furnished|Buy|New":24647312,"Rural|5|Furnished|Buy|PreOwned":23144796,"Rural|5|Non-Furnished|Rent|None":95463,"Rural|5|Non-Furnished|Buy|New":23660882,"Rural|5|Non-Furnished|Buy|PreOwned":22079854},"locality":{"Koregaon Park|1|Furnished|Rent|None":31830,"Koregaon Park|1|Furnished|Buy|New":8781846,"Koregaon Park|1|Furnished|Buy|PreOwned":6751034,"Koregaon Park|1|Non-Furnished|Rent|None":25355,"Koregaon Park|1|Non-Furnished|Buy|New":7715704,"Koregaon Park|1|Non-Furnished|Buy|PreOwned":6225454,"Koregaon Park|2|Furnished|Rent|None":54210,"Koregaon Park|2|Furnished|Buy|New":13417287,"Koregaon Park|2|Furnished|Buy|PreOwned":12019345,"Koregaon Park|2|Non-Furnished|Rent|None":45114,"Koregaon Park|2|Non-Furnished|Buy|New":12481454,"Koregaon Park|2|Non-Furnished|Buy|PreOwned":11202643,"Koregaon Park|3|Furnished|Rent|None":79139,"Koregaon Park|3|Furnished|Buy|New":20521289,"Koregaon Park|3|Furnished|Buy|PreOwned":19129057,"Koregaon Park|3|Non-Furnished|Rent|None":71095,"Koregaon Park|3|Non-Furnished|Buy|New":19630001,"Koregaon Park|3|Non-Furnished|Buy|PreOwned":18186456,"Koregaon Park|4|Furnished|Rent|None":128078,"Koregaon Park|4|Furnished|Buy|New":28667762,"Koregaon Park|4|Furnished|Buy|PreOwned":27102416,"Koregaon Park|4|Non-Furnished|Rent|None":121001,"Koregaon Park|4|Non-Furnished|Buy|New":27870085,"Koregaon Park|4|Non-Furnished|Buy|PreOwned":26208146,"Koregaon Park|5|Furnished|Rent|None":187140,"Koregaon Park|5|Furnished|Buy|New":42783437,"Koregaon Park|5|Furnished|Buy|PreOwned":40942922,"Koregaon Park|5|Non-Furnished|Rent|None":179467,"Koregaon Park|5|Non-Furnished|Buy|New":41823678,"Koregaon Park|5|Non-Furnished|Buy|PreOwned":39980104,"Viman Nagar|1|Furnished|Rent|None":33947,"Viman Nagar|1|Furnished|Buy|New":8694982,"Viman Nagar|1|Furnished|Buy|PreOwned":7143764,"Viman Nagar|1|Non-Furnished|Rent|None":25432,"Viman Nagar|1|Non-Furnished|Buy|New":7844272,"Viman Nagar|1|Non-Furnished|Buy|PreOwned":6198014,"Viman Nagar|2|Furnished|Rent|None":52559,"Viman Nagar|2|Furnished|Buy|New":13666188,"Viman Nagar|2|Furnished|Buy|PreOwned":12066311,"Viman Nagar|2|Non-Furnished|Rent|None":45884,"Viman Nagar|2|Non-Furnished|Buy|New":12787854,"Viman Nagar|2|Non-Furnished|Buy|PreOwned":11326375,"Viman Nagar|3|Furnished|Rent|None":78342,"Viman Nagar|3|Furnished|Buy|New":20947722,"Viman Nagar|3|Furnished|Buy|PreOwned":19308607,"Viman Nagar|3|Non-Furnished|Rent|None":71047,"Viman Nagar|3|Non-Furnished|Buy|New":19683874,"Viman Nagar|3|Non-Furnished|Buy|PreOwned":18049452,"Viman Nagar|4|Furnished|Rent|None":129500,"Viman Nagar|4|Furnished|Buy|New":28757193,"Viman Nagar|4|Furnished|Buy|PreOwned":27087630,"Viman Nagar|4|Non-Furnished|Rent|None":120382,"Viman Nagar|4|Non-Furnished|Buy|New":27827712,"Viman Nagar|4|Non-Furnished|Buy|PreOwned":25919522,"Viman Nagar|5|Furnished|Rent|None":188462,"Viman Nagar|5|Furnished|Buy|New":42273472,"Viman Nagar|5|Furnished|Buy|PreOwned":41111438,"Viman Nagar|5|Non-Furnished|Rent|None":180827,"Viman Nagar|5|Non-Furnished|Buy|New":41573906,"Viman Nagar|5|Non-Furnished|Buy|PreOwned":40091299,"Kothrud|1|Furnished|Rent|None":34379,"Kothrud|1|Furnished|Buy|New":8738995,"Kothrud|1|Furnished|Buy|PreOwned":7083699,"Kothrud|1|Non-Furnished|Rent|None":25806,"Kothrud|1|Non-Furnished|Buy|New":7857449,"Kothrud|1|Non-Furnished|Buy|PreOwned":6140483,"Kothrud|2|Furnished|Rent|None":54346,"Kothrud|2|Furnished|Buy|New":13665290,"Kothrud|2|Furnished|Buy|PreOwned":12176565,"Kothrud|2|Non-Furnished|Rent|None":45645,"Kothrud|2|Non-Furnished|Buy|New":12768290,"Kothrud|2|Non-Furnished|Buy|PreOwned":11133847,"Kothrud|3|Furnished|Rent|None":78032,"Kothrud|3|Furnished|Buy|New":20423662,"Kothrud|3|Furnished|Buy|PreOwned":19058628,"Kothrud|3|Non-Furnished|Rent|None":70595,"Kothrud|3|Non-Furnished|Buy|New":19503016,"Kothrud|3|Non-Furnished|Buy|PreOwned":18132757,"Kothrud|4|Furnished|Rent|None":128237,"Kothrud|4|Furnished|Buy|New":28479301,"Kothrud|4|Furnished|Buy|PreOwned":26867380,"Kothrud|4|Non-Furnished|Rent|None":119462,"Kothrud|4|Non-Furnished|Buy|New":27351601,"Kothrud|4|Non-Furnished|Buy|PreOwned":26098990,"Kothrud|5|Furnished|Rent|None":188431,"Kothrud|5|Furnished|Buy|New":42380359,"Kothrud|5|Furnished|Buy|PreOwned":41144438,"Kothrud|5|Non-Furnished|Rent|None":181181,"Kothrud|5|Non-Furnished|Buy|New":41467797,"Kothrud|5|Non-Furnished|Buy|PreOwned":40125388,"Shivaji Nagar|1|Furnished|Rent|None":32913,"Shivaji Nagar|1|Furnished|Buy|New":8612246,"Shivaji Nagar|1|Furnished|Buy|PreOwned":7200976,"Shivaji Nagar|1|Non-Furnished|Rent|None":25449,"Shivaji Nagar|1|Non-Furnished|Buy|New":7414328,"Shivaji Nagar|1|Non-Furnished|Buy|PreOwned":6130942,"Shivaji Nagar|2|Furnished|Rent|None":53461,"Shivaji Nagar|2|Furnished|Buy|New":13514235,"Shivaji Nagar|2|Furnished|Buy|PreOwned":12135960,"Shivaji Nagar|2|Non-Furnished|Rent|None":46367,"Shivaji Nagar|2|Non-Furnished|Buy|New":12570657,"Shivaji Nagar|2|Non-Furnished|Buy|PreOwned":11075608,"Shivaji Nagar|3|Furnished|Rent|None":77569,"Shivaji Nagar|3|Furnished|Buy|New":20444038,"Shivaji Nagar|3|Furnished|Buy|PreOwned":19076298,"Shivaji Nagar|3|Non-Furnished|Rent|None":70314,"Shivaji Nagar|3|Non-Furnished|Buy|New":19713501,"Shivaji Nagar|3|Non-Furnished|Buy|PreOwned":18267294,"Shivaji Nagar|4|Furnished|Rent|None":126481,"Shivaji Nagar|4|Furnished|Buy|New":28842514,"Shivaji Nagar|4|Furnished|Buy|PreOwned":27117833,"Shivaji Nagar|4|Non-Furnished|Rent|None":121067,"Shivaji Nagar|4|Non-Furnished|Buy|New":27797647,"Shivaji Nagar|4|Non-Furnished|Buy|PreOwned":26062423,"Shivaji Nagar|5|Furnished|Rent|None":186114,"Shivaji Nagar|5|Furnished|Buy|New":42717535,"Shivaji Nagar|5|Furnished|Buy|PreOwned":41258740,"Shivaji Nagar|5|Non-Furnished|Rent|None":180953,"Shivaji Nagar|5|Non-Furnished|Buy|New":41604113,"Shivaji Nagar|5|Non-Furnished|Buy|PreOwned":40149731,"Baner|1|Furnished|Rent|None":32474,"Baner|1|Furnished|Buy|New":8533186,"Baner|1|Furnished|Buy|PreOwned":7162748,"Baner|1|Non-Furnished|Rent|None":26063,"Baner|1|Non-Furnished|Buy|New":7581188,"Baner|1|Non-Furnished|Buy|PreOwned":6069866,"Baner|2|Furnished|Rent|None":53781,"Baner|2|Furnished|Buy|New":14155833,"Baner|2|Furnished|Buy|PreOwned":11977940,"Baner|2|Non-Furnished|Rent|None":45039,"Baner|2|Non-Furnished|Buy|New":12786104,"Baner|2|Non-Furnished|Buy|PreOwned":11281260,"Baner|3|Furnished|Rent|None":78143,"Baner|3|Furnished|Buy|New":20721173,"Baner|3|Furnished|Buy|PreOwned":18900299,"Baner|3|Non-Furnished|Rent|None":70404,"Baner|3|Non-Furnished|Buy|New":19853888,"Baner|3|Non-Furnished|Buy|PreOwned":18009040,"Baner|4|Furnished|Rent|None":128418,"Baner|4|Furnished|Buy|New":29101604,"Baner|4|Furnished|Buy|PreOwned":26835613,"Baner|4|Non-Furnished|Rent|None":121292,"Baner|4|Non-Furnished|Buy|New":27786903,"Baner|4|Non-Furnished|Buy|PreOwned":26073268,"Baner|5|Furnished|Rent|None":187053,"Baner|5|Furnished|Buy|New":42488564,"Baner|5|Furnished|Buy|PreOwned":41169040,"Baner|5|Non-Furnished|Rent|None":179806,"Baner|5|Non-Furnished|Buy|New":41588699,"Baner|5|Non-Furnished|Buy|PreOwned":40218322,"Kharadi|1|Furnished|Rent|None":32233,"Kharadi|1|Furnished|Buy|New":8453259,"Kharadi|1|Furnished|Buy|PreOwned":7114079,"Kharadi|1|Non-Furnished|Rent|None":25013,"Kharadi|1|Non-Furnished|Buy|New":7706407,"Kharadi|1|Non-Furnished|Buy|PreOwned":6166609,"Kharadi|2|Furnished|Rent|None":52724,"Kharadi|2|Furnished|Buy|New":13634253,"Kharadi|2|Furnished|Buy|PreOwned":12071676,"Kharadi|2|Non-Furnished|Rent|None":45974,"Kharadi|2|Non-Furnished|Buy|New":12638475,"Kharadi|2|Non-Furnished|Buy|PreOwned":11160353,"Kharadi|3|Furnished|Rent|None":77023,"Kharadi|3|Furnished|Buy|New":20989934,"Kharadi|3|Furnished|Buy|PreOwned":19014014,"Kharadi|3|Non-Furnished|Rent|None":70792,"Kharadi|3|Non-Furnished|Buy|New":19572267,"Kharadi|3|Non-Furnished|Buy|PreOwned":18249324,"Kharadi|4|Furnished|Rent|None":128004,"Kharadi|4|Furnished|Buy|New":28760232,"Kharadi|4|Furnished|Buy|PreOwned":27030043,"Kharadi|4|Non-Furnished|Rent|None":119820,"Kharadi|4|Non-Furnished|Buy|New":27547388,"Kharadi|4|Non-Furnished|Buy|PreOwned":26139825,"Kharadi|5|Furnished|Rent|None":188616,"Kharadi|5|Furnished|Buy|New":42718418,"Kharadi|5|Furnished|Buy|PreOwned":41190796,"Kharadi|5|Non-Furnished|Rent|None":181165,"Kharadi|5|Non-Furnished|Buy|New":41489094,"Kharadi|5|Non-Furnished|Buy|PreOwned":40106552,"Aundh|1|Furnished|Rent|None":32705,"Aundh|1|Furnished|Buy|New":8602670,"Aundh|1|Furnished|Buy|PreOwned":7180744,"Aundh|1|Non-Furnished|Rent|None":25525,"Aundh|1|Non-Furnished|Buy|New":7793785,"Aundh|1|Non-Furnished|Buy|PreOwned":6019848,"Aundh|2|Furnished|Rent|None":54450,"Aundh|2|Furnished|Buy|New":13523683,"Aundh|2|Furnished|Buy|PreOwned":11937950,"Aundh|2|Non-Furnished|Rent|None":44880,"Aundh|2|Non-Furnished|Buy|New":12631690,"Aundh|2|Non-Furnished|Buy|PreOwned":11088843,"Aundh|3|Furnished|Rent|None":77747,"Aundh|3|Furnished|Buy|New":20735623,"Aundh|3|Furnished|Buy|PreOwned":18999941,"Aundh|3|Non-Furnished|Rent|None":70734,"Aundh|3|Non-Furnished|Buy|New":19782760,"Aundh|3|Non-Furnished|Buy|PreOwned":18067599,"Aundh|4|Furnished|Rent|None":127567,"Aundh|4|Furnished|Buy|New":28766332,"Aundh|4|Furnished|Buy|PreOwned":26934685,"Aundh|4|Non-Furnished|Rent|None":119960,"Aundh|4|Non-Furnished|Buy|New":27385648,"Aundh|4|Non-Furnished|Buy|PreOwned":26138608,"Aundh|5|Furnished|Rent|None":188146,"Aundh|5|Furnished|Buy|New":42476504,"Aundh|5|Furnished|Buy|PreOwned":41151942,"Aundh|5|Non-Furnished|Rent|None":180513,"Aundh|5|Non-Furnished|Buy|New":41692093,"Aundh|5|Non-Furnished|Buy|PreOwned":40107351,"Wakad|1|Furnished|Rent|None":26045,"Wakad|1|Furnished|Buy|New":6776438,"Wakad|1|Furnished|Buy|PreOwned":5087535,"Wakad|1|Non-Furnished|Rent|None":18653,"Wakad|1|Non-Furnished|Buy|New":5609573,"Wakad|1|Non-Furnished|Buy|PreOwned":4239626,"Wakad|2|Furnished|Rent|None":37349,"Wakad|2|Furnished|Buy|New":10120193,"Wakad|2|Furnished|Buy|PreOwned":8563207,"Wakad|2|Non-Furnished|Rent|None":30580,"Wakad|2|Non-Furnished|Buy|New":9157999,"Wakad|2|Non-Furnished|Buy|PreOwned":7636668,"Wakad|3|Furnished|Rent|None":58877,"Wakad|3|Furnished|Buy|New":15478300,"Wakad|3|Furnished|Buy|PreOwned":14160070,"Wakad|3|Non-Furnished|Rent|None":50166,"Wakad|3|Non-Furnished|Buy|New":14620476,"Wakad|3|Non-Furnished|Buy|PreOwned":13173264,"Wakad|4|Furnished|Rent|None":92992,"Wakad|4|Furnished|Buy|New":22493912,"Wakad|4|Furnished|Buy|PreOwned":20970642,"Wakad|4|Non-Furnished|Rent|None":85042,"Wakad|4|Non-Furnished|Buy|New":21702735,"Wakad|4|Non-Furnished|Buy|PreOwned":20121908,"Wakad|5|Furnished|Rent|None":138446,"Wakad|5|Furnished|Buy|New":32435066,"Wakad|5|Furnished|Buy|PreOwned":30980312,"Wakad|5|Non-Furnished|Rent|None":131028,"Wakad|5|Non-Furnished|Buy|New":31793875,"Wakad|5|Non-Furnished|Buy|PreOwned":30147545,"Hadapsar|1|Furnished|Rent|None":26531,"Hadapsar|1|Furnished|Buy|New":6644071,"Hadapsar|1|Furnished|Buy|PreOwned":5008616,"Hadapsar|1|Non-Furnished|Rent|None":17895,"Hadapsar|1|Non-Furnished|Buy|New":5897124,"Hadapsar|1|Non-Furnished|Buy|PreOwned":4093643,"Hadapsar|2|Furnished|Rent|None":37591,"Hadapsar|2|Furnished|Buy|New":9727355,"Hadapsar|2|Furnished|Buy|PreOwned":8430272,"Hadapsar|2|Non-Furnished|Rent|None":30689,"Hadapsar|2|Non-Furnished|Buy|New":8953416,"Hadapsar|2|Non-Furnished|Buy|PreOwned":7804971,"Hadapsar|3|Furnished|Rent|None":58102,"Hadapsar|3|Furnished|Buy|New":15747780,"Hadapsar|3|Furnished|Buy|PreOwned":14170864,"Hadapsar|3|Non-Furnished|Rent|None":50032,"Hadapsar|3|Non-Furnished|Buy|New":14949720,"Hadapsar|3|Non-Furnished|Buy|PreOwned":13132295,"Hadapsar|4|Furnished|Rent|None":93074,"Hadapsar|4|Furnished|Buy|New":22772502,"Hadapsar|4|Furnished|Buy|PreOwned":20892725,"Hadapsar|4|Non-Furnished|Rent|None":84878,"Hadapsar|4|Non-Furnished|Buy|New":21861364,"Hadapsar|4|Non-Furnished|Buy|PreOwned":20094386,"Hadapsar|5|Furnished|Rent|None":138030,"Hadapsar|5|Furnished|Buy|New":32514013,"Hadapsar|5|Furnished|Buy|PreOwned":30949748,"Hadapsar|5|Non-Furnished|Rent|None":130508,"Hadapsar|5|Non-Furnished|Buy|New":31606746,"Hadapsar|5|Non-Furnished|Buy|PreOwned":30135026,"Magarpatta|1|Furnished|Rent|None":26043,"Magarpatta|1|Furnished|Buy|New":6525846,"Magarpatta|1|Furnished|Buy|PreOwned":5155760,"Magarpatta|1|Non-Furnished|Rent|None":18004,"Magarpatta|1|Non-Furnished|Buy|New":5945987,"Magarpatta|1|Non-Furnished|Buy|PreOwned":4253760,"Magarpatta|2|Furnished|Rent|None":39155,"Magarpatta|2|Furnished|Buy|New":10271005,"Magarpatta|2|Furnished|Buy|PreOwned":8738386,"Magarpatta|2|Non-Furnished|Rent|None":31185,"Magarpatta|2|Non-Furnished|Buy|New":9158241,"Magarpatta|2|Non-Furnished|Buy|PreOwned":7662652,"Magarpatta|3|Furnished|Rent|None":58863,"Magarpatta|3|Furnished|Buy|New":15613398,"Magarpatta|3|Furnished|Buy|PreOwned":14086891,"Magarpatta|3|Non-Furnished|Rent|None":50831,"Magarpatta|3|Non-Furnished|Buy|New":14709814,"Magarpatta|3|Non-Furnished|Buy|PreOwned":13063049,"Magarpatta|4|Furnished|Rent|None":93711,"Magarpatta|4|Furnished|Buy|New":22557079,"Magarpatta|4|Furnished|Buy|PreOwned":21132491,"Magarpatta|4|Non-Furnished|Rent|None":85479,"Magarpatta|4|Non-Furnished|Buy|New":21690490,"Magarpatta|4|Non-Furnished|Buy|PreOwned":20201340,"Magarpatta|5|Furnished|Rent|None":138488,"Magarpatta|5|Furnished|Buy|New":33241095,"Magarpatta|5|Furnished|Buy|PreOwned":31080053,"Magarpatta|5|Non-Furnished|Rent|None":131080,"Magarpatta|5|Non-Furnished|Buy|New":31853021,"Magarpatta|5|Non-Furnished|Buy|PreOwned":30139125,"Balewadi|1|Furnished|Rent|None":24478,"Balewadi|1|Furnished|Buy|New":6507784,"Balewadi|1|Furnished|Buy|PreOwned":5242102,"Balewadi|1|Non-Furnished|Rent|None":17959,"Balewadi|1|Non-Furnished|Buy|New":5913060,"Balewadi|1|Non-Furnished|Buy|PreOwned":4085028,"Balewadi|2|Furnished|Rent|None":37370,"Balewadi|2|Furnished|Buy|New":10138788,"Balewadi|2|Furnished|Buy|PreOwned":8261157,"Balewadi|2|Non-Furnished|Rent|None":30293,"Balewadi|2|Non-Furnished|Buy|New":9223874,"Balewadi|2|Non-Furnished|Buy|PreOwned":7631634,"Balewadi|3|Furnished|Rent|None":58717,"Balewadi|3|Furnished|Buy|New":15820214,"Balewadi|3|Furnished|Buy|PreOwned":14544800,"Balewadi|3|Non-Furnished|Rent|None":49933,"Balewadi|3|Non-Furnished|Buy|New":14841738,"Balewadi|3|Non-Furnished|Buy|PreOwned":13065191,"Balewadi|4|Furnished|Rent|None":91760,"Balewadi|4|Furnished|Buy|New":22701743,"Balewadi|4|Furnished|Buy|PreOwned":20809445,"Balewadi|4|Non-Furnished|Rent|None":85866,"Balewadi|4|Non-Furnished|Buy|New":21622950,"Balewadi|4|Non-Furnished|Buy|PreOwned":20218785,"Balewadi|5|Furnished|Rent|None":136583,"Balewadi|5|Furnished|Buy|New":32968728,"Balewadi|5|Furnished|Buy|PreOwned":31264872,"Balewadi|5|Non-Furnished|Rent|None":130386,"Balewadi|5|Non-Furnished|Buy|New":32048288,"Balewadi|5|Non-Furnished|Buy|PreOwned":30199166,"Hinjewadi|1|Furnished|Rent|None":26751,"Hinjewadi|1|Furnished|Buy|New":6749739,"Hinjewadi|1|Furnished|Buy|PreOwned":5101356,"Hinjewadi|1|Non-Furnished|Rent|None":19407,"Hinjewadi|1|Non-Furnished|Buy|New":5881751,"Hinjewadi|1|Non-Furnished|Buy|PreOwned":4072897,"Hinjewadi|2|Furnished|Rent|None":38359,"Hinjewadi|2|Furnished|Buy|New":10011789,"Hinjewadi|2|Furnished|Buy|PreOwned":8604732,"Hinjewadi|2|Non-Furnished|Rent|None":30680,"Hinjewadi|2|Non-Furnished|Buy|New":9220633,"Hinjewadi|2|Non-Furnished|Buy|PreOwned":7495533,"Hinjewadi|3|Furnished|Rent|None":57410,"Hinjewadi|3|Furnished|Buy|New":15300055,"Hinjewadi|3|Furnished|Buy|PreOwned":14111855,"Hinjewadi|3|Non-Furnished|Rent|None":50408,"Hinjewadi|3|Non-Furnished|Buy|New":14742253,"Hinjewadi|3|Non-Furnished|Buy|PreOwned":13284973,"Hinjewadi|4|Furnished|Rent|None":94123,"Hinjewadi|4|Furnished|Buy|New":22622319,"Hinjewadi|4|Furnished|Buy|PreOwned":21101042,"Hinjewadi|4|Non-Furnished|Rent|None":84539,"Hinjewadi|4|Non-Furnished|Buy|New":21640455,"Hinjewadi|4|Non-Furnished|Buy|PreOwned":20101854,"Hinjewadi|5|Furnished|Rent|None":136066,"Hinjewadi|5|Furnished|Buy|New":32655443,"Hinjewadi|5|Furnished|Buy|PreOwned":31221869,"Hinjewadi|5|Non-Furnished|Rent|None":130333,"Hinjewadi|5|Non-Furnished|Buy|New":31880461,"Hinjewadi|5|Non-Furnished|Buy|PreOwned":30068519,"Pimpri|1|Furnished|Rent|None":24068,"Pimpri|1|Furnished|Buy|New":6686044,"Pimpri|1|Furnished|Buy|PreOwned":5146416,"Pimpri|1|Non-Furnished|Rent|None":18055,"Pimpri|1|Non-Furnished|Buy|New":5515741,"Pimpri|1|Non-Furnished|Buy|PreOwned":4110336,"Pimpri|2|Furnished|Rent|None":37600,"Pimpri|2|Furnished|Buy|New":10107624,"Pimpri|2|Furnished|Buy|PreOwned":8441444,"Pimpri|2|Non-Furnished|Rent|None":30844,"Pimpri|2|Non-Furnished|Buy|New":9223433,"Pimpri|2|Non-Furnished|Buy|PreOwned":7723937,"Pimpri|3|Furnished|Rent|None":57238,"Pimpri|3|Furnished|Buy|New":15593384,"Pimpri|3|Furnished|Buy|PreOwned":14246224,"Pimpri|3|Non-Furnished|Rent|None":50735,"Pimpri|3|Non-Furnished|Buy|New":14552570,"Pimpri|3|Non-Furnished|Buy|PreOwned":13339918,"Pimpri|4|Furnished|Rent|None":93477,"Pimpri|4|Furnished|Buy|New":22296049,"Pimpri|4|Furnished|Buy|PreOwned":21110238,"Pimpri|4|Non-Furnished|Rent|None":85246,"Pimpri|4|Non-Furnished|Buy|New":21769521,"Pimpri|4|Non-Furnished|Buy|PreOwned":20228232,"Pimpri|5|Furnished|Rent|None":137451,"Pimpri|5|Furnished|Buy|New":32655623,"Pimpri|5|Furnished|Buy|PreOwned":31165121,"Pimpri|5|Non-Furnished|Rent|None":130426,"Pimpri|5|Non-Furnished|Buy|New":31548623,"Pimpri|5|Non-Furnished|Buy|PreOwned":30136214,"Yerwada|1|Furnished|Rent|None":24665,"Yerwada|1|Furnished|Buy|New":6760632,"Yerwada|1|Furnished|Buy|PreOwned":5460947,"Yerwada|1|Non-Furnished|Rent|None":18901,"Yerwada|1|Non-Furnished|Buy|New":5594429,"Yerwada|1|Non-Furnished|Buy|PreOwned":4225688,"Yerwada|2|Furnished|Rent|None":36804,"Yerwada|2|Furnished|Buy|New":10257285,"Yerwada|2|Furnished|Buy|PreOwned":8751162,"Yerwada|2|Non-Furnished|Rent|None":30324,"Yerwada|2|Non-Furnished|Buy|New":8705736,"Yerwada|2|Non-Furnished|Buy|PreOwned":7615354,"Yerwada|3|Furnished|Rent|None":58436,"Yerwada|3|Furnished|Buy|New":16099725,"Yerwada|3|Furnished|Buy|PreOwned":14127498,"Yerwada|3|Non-Furnished|Rent|None":50422,"Yerwada|3|Non-Furnished|Buy|New":14778545,"Yerwada|3|Non-Furnished|Buy|PreOwned":13154074,"Yerwada|4|Furnished|Rent|None":94126,"Yerwada|4|Furnished|Buy|New":22985022,"Yerwada|4|Furnished|Buy|PreOwned":21303867,"Yerwada|4|Non-Furnished|Rent|None":86053,"Yerwada|4|Non-Furnished|Buy|New":21618538,"Yerwada|4|Non-Furnished|Buy|PreOwned":20028693,"Yerwada|5|Furnished|Rent|None":137470,"Yerwada|5|Furnished|Buy|New":32567431,"Yerwada|5|Furnished|Buy|PreOwned":31018307,"Yerwada|5|Non-Furnished|Rent|None":130514,"Yerwada|5|Non-Furnished|Buy|New":31839961,"Yerwada|5|Non-Furnished|Buy|PreOwned":30068873,"Pashan|1|Furnished|Rent|None":19223,"Pashan|1|Furnished|Buy|New":5161842,"Pashan|1|Furnished|Buy|PreOwned":3588490,"Pashan|1|Non-Furnished|Rent|None":12724,"Pashan|1|Non-Furnished|Buy|New":4018801,"Pashan|1|Non-Furnished|Buy|PreOwned":2581028,"Pashan|2|Furnished|Rent|None":28925,"Pashan|2|Furnished|Buy|New":7675428,"Pashan|2|Furnished|Buy|PreOwned":6153126,"Pashan|2|Non-Furnished|Rent|None":20628,"Pashan|2|Non-Furnished|Buy|New":6742666,"Pashan|2|Non-Furnished|Buy|PreOwned":5238537,"Pashan|3|Furnished|Rent|None":43779,"Pashan|3|Furnished|Buy|New":11030440,"Pashan|3|Furnished|Buy|PreOwned":9691869,"Pashan|3|Non-Furnished|Rent|None":36392,"Pashan|3|Non-Furnished|Buy|New":9906772,"Pashan|3|Non-Furnished|Buy|PreOwned":8793906,"Pashan|4|Furnished|Rent|None":69896,"Pashan|4|Furnished|Buy|New":16554712,"Pashan|4|Furnished|Buy|PreOwned":14810969,"Pashan|4|Non-Furnished|Rent|None":60018,"Pashan|4|Non-Furnished|Buy|New":15598387,"Pashan|4|Non-Furnished|Buy|PreOwned":14202222,"Pashan|5|Furnished|Rent|None":102779,"Pashan|5|Furnished|Buy|New":24634776,"Pashan|5|Furnished|Buy|PreOwned":23156927,"Pashan|5|Non-Furnished|Rent|None":95775,"Pashan|5|Non-Furnished|Buy|New":23252193,"Pashan|5|Non-Furnished|Buy|PreOwned":22068302,"Lavasa|1|Furnished|Rent|None":18359,"Lavasa|1|Furnished|Buy|New":5317437,"Lavasa|1|Furnished|Buy|PreOwned":3947200,"Lavasa|1|Non-Furnished|Rent|None":12998,"Lavasa|1|Non-Furnished|Buy|New":4030549,"Lavasa|1|Non-Furnished|Buy|PreOwned":2634543,"Lavasa|2|Furnished|Rent|None":28099,"Lavasa|2|Furnished|Buy|New":7664046,"Lavasa|2|Furnished|Buy|PreOwned":6043574,"Lavasa|2|Non-Furnished|Rent|None":20190,"Lavasa|2|Non-Furnished|Buy|New":6890187,"Lavasa|2|Non-Furnished|Buy|PreOwned":5265272,"Lavasa|3|Furnished|Rent|None":41333,"Lavasa|3|Furnished|Buy|New":11296490,"Lavasa|3|Furnished|Buy|PreOwned":9803170,"Lavasa|3|Non-Furnished|Rent|None":34427,"Lavasa|3|Non-Furnished|Buy|New":9999690,"Lavasa|3|Non-Furnished|Buy|PreOwned":8656284,"Lavasa|4|Furnished|Rent|None":67612,"Lavasa|4|Furnished|Buy|New":16720751,"Lavasa|4|Furnished|Buy|PreOwned":15361156,"Lavasa|4|Non-Furnished|Rent|None":61566,"Lavasa|4|Non-Furnished|Buy|New":15796924,"Lavasa|4|Non-Furnished|Buy|PreOwned":14141360,"Lavasa|5|Furnished|Rent|None":102339,"Lavasa|5|Furnished|Buy|New":24613221,"Lavasa|5|Furnished|Buy|PreOwned":23023224,"Lavasa|5|Non-Furnished|Rent|None":95358,"Lavasa|5|Non-Furnished|Buy|New":23863432,"Lavasa|5|Non-Furnished|Buy|PreOwned":22048506,"Mulshi|1|Furnished|Rent|None":19815,"Mulshi|1|Furnished|Buy|New":4767764,"Mulshi|1|Furnished|Buy|PreOwned":3497986,"Mulshi|1|Non-Furnished|Rent|None":11932,"Mulshi|1|Non-Furnished|Buy|New":4112469,"Mulshi|1|Non-Furnished|Buy|PreOwned":2573137,"Mulshi|2|Furnished|Rent|None":27991,"Mulshi|2|Furnished|Buy|New":7618517,"Mulshi|2|Furnished|Buy|PreOwned":6281413,"Mulshi|2|Non-Furnished|Rent|None":20436,"Mulshi|2|Non-Furnished|Buy|New":6612929,"Mulshi|2|Non-Furnished|Buy|PreOwned":5087131,"Mulshi|3|Furnished|Rent|None":43764,"Mulshi|3|Furnished|Buy|New":11078565,"Mulshi|3|Furnished|Buy|PreOwned":9768199,"Mulshi|3|Non-Furnished|Rent|None":36270,"Mulshi|3|Non-Furnished|Buy|New":10309839,"Mulshi|3|Non-Furnished|Buy|PreOwned":8665696,"Mulshi|4|Furnished|Rent|None":69190,"Mulshi|4|Furnished|Buy|New":16628948,"Mulshi|4|Furnished|Buy|PreOwned":15109240,"Mulshi|4|Non-Furnished|Rent|None":60458,"Mulshi|4|Non-Furnished|Buy|New":15857353,"Mulshi|4|Non-Furnished|Buy|PreOwned":14292142,"Mulshi|5|Furnished|Rent|None":104510,"Mulshi|5|Furnished|Buy|New":24693940,"Mulshi|5|Furnished|Buy|PreOwned":23254236,"Mulshi|5|Non-Furnished|Rent|None":95256,"Mulshi|5|Non-Furnished|Buy|New":23867019,"Mulshi|5|Non-Furnished|Buy|PreOwned":22122755}};

// Convert raw ₹ to Lakhs (2 decimal places) — keeps Y-axis consistent
function toLakh(n) { return n ? Math.round(n / 1000) / 100 : null; }

function lookupLakh(src, key1, bhk, furn, cond, type) {
  const val = PRICE_DATA[src][`${key1}|${bhk}|${furn}|${cond}|${type}`];
  return val ? toLakh(val) : null;
}

// ─── Chart tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ margin: '0 0 6px', fontWeight: 700 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: p.color }}>
          {p.name}: ₹{p.value} L
        </p>
      ))}
    </div>
  );
}

const LINE_DEFS = {
  Rent: [
    { key: 'Furnished',     color: '#4f46e5' },
    { key: 'Non-Furnished', color: '#e11d48' },
  ],
  Buy: [
    { key: 'Furn · New',       color: '#4f46e5' },
    { key: 'Furn · PreOwned',  color: '#0d9488' },
    { key: 'Non-Furn · New',   color: '#e11d48' },
    { key: 'Non-Furn · PreOwned', color: '#f59e0b' },
  ],
};

// ─── Main App ────────────────────────────────────────────────────────────────
function App() {
  // Metadata from backend
  const [metadata,    setMetadata]    = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaError,   setMetaError]   = useState(null);

  // Form inputs
  const [condition,     setCondition]     = useState('Rent');
  const [locality,      setLocality]      = useState('');
  const [bhk,           setBhk]           = useState(2);
  const [furnished,     setFurnished]     = useState('Furnished');
  const [propertyType,  setPropertyType]  = useState('None');

  // Locality search
  const [searchQuery,   setSearchQuery]   = useState('');
  const [showDropdown,  setShowDropdown]  = useState(false);
  const dropdownRef = useRef(null);

  // Prediction output
  const [prediction,      setPrediction]      = useState(null);
  const [predictLoading,  setPredictLoading]  = useState(false);
  const [predictError,    setPredictError]    = useState(null);

  // Chart
  const [chartView, setChartView] = useState('locality'); // 'locality' | 'area'

  // ── Fetch metadata ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('https://estatepredict-ruoi.onrender.com/metadata')
      .then(res => { if (!res.ok) throw new Error('Failed to load server metadata.'); return res.json(); })
      .then(data => {
        setMetadata(data);
        setLoadingMeta(false);
        if (data.localities?.length > 0) {
          setLocality(data.localities[0]);
          setSearchQuery(data.localities[0]);
        }
      })
      .catch(err => { setMetaError(err.message); setLoadingMeta(false); });
  }, []);

  // ── Sync property type when condition changes ───────────────────────────────
  useEffect(() => {
    if (condition === 'Rent') setPropertyType('None');
    else if (condition === 'Buy' && propertyType === 'None') setPropertyType('New');
  }, [condition]);

  // ── Auto-predict on input change (debounced) ────────────────────────────────
  useEffect(() => {
    if (!locality || loadingMeta) return;
    setPredictLoading(true);
    setPredictError(null);
    const payload = { locality, bhk: parseInt(bhk, 10), furnished, condition, type: condition === 'Rent' ? 'None' : propertyType };
    const timer = setTimeout(() => {
      fetch('https://estatepredict-ruoi.onrender.com/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(res => { if (!res.ok) throw new Error('Prediction API failed.'); return res.json(); })
        .then(data => {
          if (data.error) { setPredictError(data.error); setPrediction(null); }
          else setPrediction(data.predicted_price);
          setPredictLoading(false);
        })
        .catch(err => { setPredictError(err.message); setPrediction(null); setPredictLoading(false); });
    }, 200);
    return () => clearTimeout(timer);
  }, [locality, bhk, furnished, condition, propertyType, loadingMeta]);

  // ── Close dropdown on outside click ────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
        if (metadata && !metadata.localities.includes(searchQuery)) setSearchQuery(locality);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [locality, searchQuery, metadata]);

  // ── Loading / error screens ─────────────────────────────────────────────────
  if (loadingMeta) return (
    <div className="center-screen">
      <div className="loader"></div>
      <p className="loading-text">Connecting to ML server...</p>
    </div>
  );

  if (metaError) return (
    <div className="center-screen">
      <div className="error-card">
        <div className="error-icon">⚠️</div>
        <h2>Connection Error</h2>
        <p>Unable to connect to the Flask server at <code>https://estatepredict-ruoi.onrender.com</code>.</p>
        <p className="error-details">Details: {metaError}</p>
        <button className="retry-btn" onClick={() => window.location.reload()}>Retry Connection</button>
      </div>
    </div>
  );

  // ── Derived values ──────────────────────────────────────────────────────────
  const filteredLocalities = metadata
    ? metadata.localities.filter(loc => loc.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const currentLocalityStats = metadata?.stats?.[locality] ?? { Rent: 0, Buy: 0 };
  const currentAverage = condition === 'Rent' ? currentLocalityStats.Rent : currentLocalityStats.Buy;

  let percentageDifference = 0, isHigher = false;
  if (prediction && currentAverage > 0) {
    const diff = prediction - currentAverage;
    percentageDifference = Math.round((Math.abs(diff) / currentAverage) * 100);
    isHigher = diff > 0;
  }

  const getComparisonLocalities = () => {
    if (!metadata?.stats) return [];
    const sorted = Object.entries(metadata.stats)
      .map(([name, priceMap]) => ({ name, price: priceMap[condition] }))
      .filter(item => item.price > 0)
      .sort((a, b) => b.price - a.price);
    const top3 = sorted.slice(0, 3);
    const cheapest = sorted.slice(-1);
    const combined = [...top3];
    if (!combined.some(item => item.name === locality) && currentAverage > 0)
      combined.push({ name: locality, price: currentAverage });
    if (!combined.some(item => item.name === cheapest[0]?.name) && cheapest[0])
      combined.push(cheapest[0]);
    return combined.sort((a, b) => b.price - a.price);
  };

  const comparisonData = getComparisonLocalities();
  const maxComparisonPrice = comparisonData.length > 0 ? Math.max(...comparisonData.map(d => d.price)) : 1;

  const formatCurrency = (val) => {
    if (val == null) return 'Calculating...';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  // ── Chart data builders ─────────────────────────────────────────────────────
  const typeKey = condition === 'Rent' ? 'None' : propertyType;

  function buildLocalityChartData() {
    const allLocs = metadata?.localities ?? [];
    return allLocs.map(loc => {
      const row = { name: loc };
      if (condition === 'Rent') {
        row['Furnished']     = lookupLakh('locality', loc, bhk, 'Furnished',     'Rent', 'None');
        row['Non-Furnished'] = lookupLakh('locality', loc, bhk, 'Non-Furnished', 'Rent', 'None');
      } else {
        row['Furn · New']          = lookupLakh('locality', loc, bhk, 'Furnished',     'Buy', 'New');
        row['Furn · PreOwned']     = lookupLakh('locality', loc, bhk, 'Furnished',     'Buy', 'PreOwned');
        row['Non-Furn · New']      = lookupLakh('locality', loc, bhk, 'Non-Furnished', 'Buy', 'New');
        row['Non-Furn · PreOwned'] = lookupLakh('locality', loc, bhk, 'Non-Furnished', 'Buy', 'PreOwned');
      }
      return row;
    });
  }

  function buildAreaChartData() {
    return ['Urban', 'SemiUrban', 'Rural'].map(r => {
      const row = { name: r === 'SemiUrban' ? 'Semi-Urban' : r, _r: r };
      if (condition === 'Rent') {
        row['Furnished']     = lookupLakh('area', r, bhk, 'Furnished',     'Rent', 'None');
        row['Non-Furnished'] = lookupLakh('area', r, bhk, 'Non-Furnished', 'Rent', 'None');
      } else {
        row['Furn · New']          = lookupLakh('area', r, bhk, 'Furnished',     'Buy', 'New');
        row['Furn · PreOwned']     = lookupLakh('area', r, bhk, 'Furnished',     'Buy', 'PreOwned');
        row['Non-Furn · New']      = lookupLakh('area', r, bhk, 'Non-Furnished', 'Buy', 'New');
        row['Non-Furn · PreOwned'] = lookupLakh('area', r, bhk, 'Non-Furnished', 'Buy', 'PreOwned');
      }
      return row;
    });
  }

  const chartData = chartView === 'area' ? buildAreaChartData() : buildLocalityChartData();
  const lineKeys  = LINE_DEFS[condition];

  // ── ReferenceDot: find which line the prediction sits on ───────────────────
  let predDot = null;
  if (prediction != null) {
    const xLabel = chartView === 'area'
      ? (getAreaType(locality) === 'SemiUrban' ? 'Semi-Urban' : getAreaType(locality))
      : locality;
    const yKey = condition === 'Rent'
      ? (furnished === 'Furnished' ? 'Furnished' : 'Non-Furnished')
      : (furnished === 'Furnished'
          ? (propertyType === 'New' ? 'Furn · New' : 'Furn · PreOwned')
          : (propertyType === 'New' ? 'Non-Furn · New' : 'Non-Furn · PreOwned'));
    const row = chartData.find(r => r.name === xLabel);
    if (row && row[yKey] != null) predDot = { x: xLabel, y: row[yKey] };
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-area">
          <span className="logo-icon">✨</span>
          <h1>EstatePredict AI</h1>
        </div>
        <p className="app-subtitle">Real-time House Pricing Model powered by RandomForest Regression</p>
      </header>

      {/* Main Grid */}
      <main className="dashboard-grid">

        {/* ── Left: Form Controls ───────────────────────────────────────────── */}
        <section className="card control-panel">
          <h2 className="section-title">Configure Property</h2>

          {/* Deal Type */}
          <div className="form-group">
            <label className="form-label">I want to:</label>
            <div className="deal-tabs">
              {['Rent', 'Buy'].map(c => (
                <button key={c} type="button" className={`deal-tab ${condition === c ? 'active' : ''}`}
                  onClick={() => setCondition(c)}>
                  {c} a Flat
                </button>
              ))}
            </div>
          </div>

          {/* Locality Search */}
          <div className="form-group search-container" ref={dropdownRef}>
            <label className="form-label" htmlFor="locality-search">Locality:</label>
            <div className="input-wrapper">
              <span className="input-icon">📍</span>
              <input id="locality-search" type="text" className="form-input"
                placeholder="Search Locality (e.g. Koregaon Park, Baner...)"
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }} />
            </div>
            {showDropdown && (
              <div className="locality-dropdown">
                {filteredLocalities.length > 0
                  ? filteredLocalities.map(loc => (
                      <div key={loc} className={`dropdown-item ${loc === locality ? 'selected' : ''}`}
                        onClick={() => { setLocality(loc); setSearchQuery(loc); setShowDropdown(false); }}>
                        {loc}
                      </div>
                    ))
                  : <div className="dropdown-item empty">No matching localities</div>}
              </div>
            )}
          </div>

          {/* BHK */}
          <div className="form-group">
            <label className="form-label">BHK size:</label>
            <div className="pill-selector">
              {[1, 2, 3, 4, 5].map(num => (
                <button key={num} type="button" className={`pill ${bhk === num ? 'active' : ''}`}
                  onClick={() => setBhk(num)}>{num} BHK</button>
              ))}
            </div>
          </div>

          {/* Furnishing */}
          <div className="form-group">
            <label className="form-label">Furnishing:</label>
            <div className="pill-selector">
              {['Furnished', 'Non-Furnished'].map(opt => (
                <button key={opt} type="button" className={`pill ${furnished === opt ? 'active' : ''}`}
                  onClick={() => setFurnished(opt)}>{opt}</button>
              ))}
            </div>
          </div>

          {/* Property Type (Buy only) */}
          {condition === 'Buy' && (
            <div className="form-group animate-slide-down">
              <label className="form-label">Flat Type:</label>
              <div className="pill-selector">
                {['New', 'PreOwned'].map(opt => (
                  <button key={opt} type="button" className={`pill ${propertyType === opt ? 'active' : ''}`}
                    onClick={() => setPropertyType(opt)}>{opt} Flat</button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Right: Results ────────────────────────────────────────────────── */}
        <section className="results-panel">

          {/* Prediction Hero */}
          <div className="card result-card">
            <h2 className="card-label">Estimated Market Value</h2>
            {predictLoading ? (
              <div className="skeleton-prediction">
                <div className="skeleton-bar"></div>
                <div className="skeleton-sub"></div>
              </div>
            ) : predictError ? (
              <div className="prediction-error">
                <span className="err-icon">⚠️</span>
                <p>{predictError}</p>
              </div>
            ) : (
              <div className="prediction-content">
                <div className="prediction-price">
                  {formatCurrency(prediction)}
                  <span className="price-suffix">{condition === 'Rent' ? ' / month' : ''}</span>
                </div>
                <p className="prediction-meta">
                  For a {furnished.toLowerCase()} {bhk} BHK
                  {condition === 'Buy' ? ` ${propertyType.toLowerCase()} ` : ' '}flat in {locality}
                </p>
              </div>
            )}
            <div className="model-badge">
              <span className="badge-dot"></span>
              RandomForest Acc: 99.86%
            </div>
          </div>

          {/* Valuation Insights */}
          <div className="card stats-card">
            <h2 className="section-title">Valuation Insights</h2>

            {prediction && currentAverage > 0 ? (
              <div className="insight-row">
                <div className="insight-gauge">
                  <div className={`gauge-percentage ${isHigher ? 'higher' : 'lower'}`}>
                    {percentageDifference}%
                  </div>
                  <div className="gauge-label">{isHigher ? 'Above' : 'Below'} Average</div>
                </div>
                <div className="insight-text">
                  <p>
                    The estimated price is <strong>{percentageDifference}% {isHigher ? 'higher' : 'lower'}</strong> than
                    the overall average {condition.toLowerCase()} price in <strong>{locality}</strong>.
                  </p>
                  <p className="average-compare">
                    Locality Average: {formatCurrency(currentAverage)}{condition === 'Rent' ? '/mo' : ''}
                  </p>
                </div>
              </div>
            ) : (
              <p className="no-stats">No average pricing data available for this locality configuration.</p>
            )}

            {/* Bar chart comparison */}
            {comparisonData.length > 0 && (
              <div className="comparison-chart-container">
                <h3 className="chart-title">Locality Price Comparison ({condition})</h3>
                <div className="bar-chart">
                  {comparisonData.map(item => {
                    const isCurrent = item.name === locality;
                    const widthPercent = (item.price / maxComparisonPrice) * 100;
                    return (
                      <div key={item.name} className={`chart-bar-row ${isCurrent ? 'highlight' : ''}`}>
                        <div className="bar-label-area">
                          <span className="bar-name">{item.name}{isCurrent && ' (Current)'}</span>
                          <span className="bar-value">{formatCurrency(item.price)}</span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${widthPercent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Line Chart (replaces broken matplotlib-style plot) ──────────── */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 10 }}>
              <h3 className="chart-title" style={{ margin: 0 }}>
                {bhk} BHK {condition} — Price Trend (₹ Lakh)
              </h3>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['locality', 'By Locality'], ['area', 'By Area Type']].map(([v, label]) => (
                  <button key={v} onClick={() => setChartView(v)} type="button"
                    className={`pill ${chartView === v ? 'active' : ''}`}
                    style={{ fontSize: 12, padding: '5px 12px' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: chartView === 'locality' ? 80 : 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={chartView === 'locality' ? -38 : 0}
                  textAnchor={chartView === 'locality' ? 'end' : 'middle'}
                  interval={0}
                  height={chartView === 'locality' ? 90 : 30}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={v => `₹${v}L`}
                  width={68}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                {lineKeys.map(({ key, color }) => (
                  <Line key={key} type="monotone" dataKey={key}
                    stroke={color} strokeWidth={2.5}
                    dot={{ r: 4, fill: color }} activeDot={{ r: 6 }}
                    connectNulls />
                ))}
                {predDot && (
                  <ReferenceDot x={predDot.x} y={predDot.y} r={9}
                    fill="#1e3a5f" stroke="#fff" strokeWidth={2.5}
                    label={{ value: `₹${predDot.y}L`, position: 'top', fontSize: 11, fill: '#1e3a5f', fontWeight: 700 }} />
                )}
              </LineChart>
            </ResponsiveContainer>
            {predDot && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                ● Dark dot marks predicted price for <strong>{locality}</strong>
              </p>
            )}
          </div>

        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer-bar">
        <p>©Programmed by Vaibhav.</p>
      </footer>
    </div>
  );
}

export default App;