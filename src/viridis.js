// @graysonlang/viridis
//
// The viridis colormap and its perceptually uniform siblings as a tiny
// dependency-free ES module. Every map here is defined by 256 canonical sRGB
// anchors, embedded below as packed hex strings (256 × "rrggbb"). Sampling
// linearly interpolates between adjacent anchors, so map(i / 255) reproduces
// anchor i exactly and everything in between is smooth.
//
// Included maps and their sources:
//   viridis, magma, plasma, inferno — Stéfan van der Walt & Nathaniel Smith
//     for matplotlib (data released CC0). Perceptually uniform, colorblind-
//     friendly, monotonically increasing in lightness.
//   cividis — Nuñez, Anderton & Renslow (PLOS ONE 2018), optimized for
//     color-vision deficiency; ships with matplotlib (CC0).
//   turbo — Anton Mikhailov, Google (Apache-2.0). An improved rainbow map:
//     smooth and vivid, but NOT monotonic in lightness — prefer the others
//     when grayscale legibility matters.
//   mako, rocket — Michael Waskom for seaborn (BSD-3-Clause). Sequential,
//     monotonically increasing in lightness.

const VIRIDIS_DATA = /* @__PURE__ */ [
  '44015444025645045745055946075a46085c460a5d460b5e470d60470e614710634711644713',
  '6548146748166848176948186a481a6c481b6d481c6e481d6f481f7048207148217348237448',
  '2475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f',
  '463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142',
  '874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b',
  '518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d',
  '355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b',
  '8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a',
  '778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e',
  '25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f',
  '8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e',
  '9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a685',
  '22a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db2',
  '7d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340',
  'bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c765',
  '5ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d0',
  '5477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195',
  'd84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2b',
  'b8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e2',
  '19dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8',
  'e621fbe723fde725',
].join('');

const MAGMA_DATA = /* @__PURE__ */ [
  '00000401000501010601010802010902020b02020d03030f0303120404140504160605180605',
  '1a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d3414',
  '0e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e221150241253',
  '25125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f',
  '6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f',
  '127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980',
  '641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621',
  '817822817922827b23827c23827e24828025828125818326818426818627818827818928818b',
  '29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7f',
  'a02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb336',
  '7ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c8',
  '3e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476a',
  'dc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb57',
  '60ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf6',
  '6c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835f',
  'fb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b',
  '6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afe',
  'b47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8d',
  'fecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2',
  'a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fc',
  'f9bbfcfbbdfcfdbf',
].join('');

const PLASMA_DATA = /* @__PURE__ */ [
  '0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05',
  '932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41',
  '049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a4',
  '5601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900',
  'a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d',
  '03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca4',
  '8f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a',
  '9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b0',
  '2991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786',
  'be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca45',
  '7acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5',
  '546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263',
  'e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e971',
  '58e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1',
  '814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143',
  'f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca3',
  '38fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efe',
  'b72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26',
  'fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df',
  '25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1',
  'f525f0f724f0f921',
].join('');

const INFERNO_DATA = /* @__PURE__ */ [
  '00000401000501010601010802010a02020c02020e0302100403120403140504170604190705',
  '1b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b3716',
  '0b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b55',
  '2b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a',
  '67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d55',
  '0f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e',
  '6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e',
  '6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f246990256892',
  '25689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60',
  'a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b935',
  '56ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb',
  '4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3c',
  'db503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee860',
  '2de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2',
  '741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890c',
  'f98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca1',
  '08fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfb',
  'ba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13d',
  'f7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea',
  '69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9',
  'fc9dfafda1fcffa4',
].join('');

const CIVIDIS_DATA = /* @__PURE__ */ [
  '00224e00234f00245100255300255400265600275800285900285b00295d002a5f002a61002b',
  '62002c64002c66002d68002e6a002e6c002f6d00306f00307000317000317101327105337108',
  '33700c34700f357012357014367016377018376f1a386f1c396f1e3a6f203a6f213b6e233c6e',
  '243c6e263d6e273e6e293f6e2a3f6d2b406d2d416d2e416d2f426d31436d32436d33446d3445',
  '6c35456c36466c38476c39486c3a486c3b496c3c4a6c3d4a6c3e4b6c3f4c6c404c6c414d6c42',
  '4e6c434e6c444f6c45506c46516c47516c48526c49536c4a536c4b546c4c556c4d556c4e566c',
  '4f576c50576c51586d52596d535a6d545a6d555b6d555c6d565c6d575d6d585e6d595e6e5a5f',
  '6e5b606e5c616e5d616e5e626e5e636f5f636f60646f61656f62656f63667064677065687065',
  '6870666970676a71686a71696b716a6c716b6d726c6d726c6e726d6f726e6f736f7073707173',
  '7172747272747273747374757474757575757676767777767777777878777979777a7a787b7a',
  '787c7b787d7c787e7c787e7d787f7e78807f78817f7882807983817984827985827986837987',
  '84788885788985788a86788b87788c88788d88788e89788f8a78908b78918b78928c78928d78',
  '938e78948e77958f779690779791779892779992779a93769b94769c95769d95769e96769f97',
  '75a09875a19975a29975a39a74a49b74a59c74a69c74a79d73a89e73a99f73aaa073aba072ac',
  'a172ada272aea371afa471b0a571b1a570b3a670b4a76fb5a86fb6a96fb7a96eb8aa6eb9ab6d',
  'baac6dbbad6dbcae6cbdae6cbeaf6bbfb06bc0b16ac1b26ac2b369c3b369c4b468c5b568c6b6',
  '67c7b767c8b866c9b965cbb965ccba64cdbb63cebc63cfbd62d0be62d1bf61d2c060d3c05fd4',
  'c15fd5c25ed6c35dd7c45cd9c55cdac65bdbc75adcc859ddc858dec958dfca57e0cb56e1cc55',
  'e2cd54e4ce53e5cf52e6d051e7d150e8d24fe9d34eead34cebd44bedd54aeed649efd748f0d8',
  '46f1d945f2da44f3db42f5dc41f6dd3ff7de3ef8df3cf9e03afbe138fce236fde334fee434fe',
  'e535fee636fee838',
].join('');

const TURBO_DATA = /* @__PURE__ */ [
  '30123b32154333184a341b51351e5836215f37246638276d392a733a2d793b2f803c32863d35',
  '8b3e38913f3b973f3e9c4040a24143a74146ac4249b1424bb5434eba4451bf4454c34456c745',
  '59cb455ccf455ed34661d64664da4666dd4669e0466be3476ee64771e94773eb4776ee4778f0',
  '477bf2467df44680f64682f84685fa4687fb458afc458cfd448ffe4391fe4294ff4196ff4099',
  'ff3e9bfe3d9efe3ba0fd3aa3fc38a5fb37a8fa35abf833adf731aff52fb2f42eb4f22cb7f02a',
  'b9ee28bceb27bee925c0e723c3e422c5e220c7df1fc9dd1ecbda1ccdd81bd0d51ad2d21ad4d0',
  '19d5cd18d7ca18d9c818dbc518ddc218dec018e0bd19e2bb19e3b91ae4b61ce6b41de7b21fe9',
  'af20eaac22ebaa25eca727eea42aefa12cf09e2ff19b32f29835f39438f4913cf58e3ff68a43',
  'f78746f8844af8804ef97d52fa7a55fa7659fb735dfc6f61fc6c65fd6969fd666dfe6271fe5f',
  '75fe5c79fe597dff5680ff5384ff5188ff4e8bff4b8fff4992ff4796fe4499fe429cfe409ffd',
  '3fa1fd3da4fc3ca7fc3aa9fb39acfb38affa37b1f936b4f836b7f735b9f635bcf534bef434c1',
  'f334c3f134c6f034c8ef34cbed34cdec34d0ea34d2e935d4e735d7e535d9e436dbe236dde037',
  'dfdf37e1dd37e3db38e5d938e7d739e9d539ebd339ecd13aeecf3aefcd3af1cb3af2c93af4c7',
  '3af5c53af6c33af7c13af8be39f9bc39faba39fbb838fbb637fcb336fcb136fdae35fdac34fe',
  'a933fea732fea431fea130fe9e2ffe9b2dfe992cfe962bfe932afe9029fd8d27fd8a26fc8725',
  'fc8423fb8122fb7e21fa7b1ff9781ef9751df8721cf76f1af66c19f56918f46617f36315f260',
  '14f15d13f05b12ef5811ed5510ec530feb500eea4e0de84b0ce7490ce5470be4450ae2430ae1',
  '4109df3f08dd3d08dc3b07da3907d83706d63506d43305d23105d02f05ce2d04cc2b04ca2a04',
  'c82803c52603c32503c12302be2102bc2002b91e02b71d02b41b01b21a01af1801ac1701a916',
  '01a71401a41301a112019e10019b0f01980e01950d01920b018e0a018b090288080285070281',
  '06027e05027a0403',
].join('');

const MAKO_DATA = /* @__PURE__ */ [
  '0b04050d04060e05080f060910060a11070c12080d13090f140910150a12160b13170c15180d',
  '16190e181a0e191b0f1a1c101c1d111d1e111f1f122020132221142322142523152624162825',
  '172926172b27182d28192e291930291a312a1b332b1c352c1c362d1d382e1e392e1e3b2f1f3d',
  '30203e31214031214232224333234534244734254835254a35264c36274d37284f3728513829',
  '53382a54392b563a2c583a2c593b2d5b3b2e5d3b2f5f3c30603c31623d31643d32663e33673e',
  '34693e356b3f366d3f366f3f3770403872403974403a76403b78403c79413d7b413e7d413e7f',
  '413f8041408241418441428541438741448840468a40478b40488d40498e3f4a8f3f4b903f4c',
  '923e4d933e4f943e50953d51953d52963c53973c55983b56983b57993b589a3a599a3a5b9b3a',
  '5c9b395d9c395e9c385f9c38619d38629d38639d37649e37659e37669e37689f36699f366a9f',
  '366b9f366ca0366da0366fa03670a03671a03572a13573a13574a13575a13576a23578a23579',
  'a2357aa2357ba3357ca3357da3357ea4347fa43480a43482a43483a53484a53485a53486a534',
  '87a63488a63489a6348ba6348ca7348da7348ea7348fa73490a83491a83492a83493a83495a9',
  '3496a93497a93498a93499aa349aaa359baa359caa359eaa359fab35a0ab35a1ab36a2ab36a3',
  'ab36a4ab37a5ac37a6ac37a8ac38a9ac38aaac39abac39acac3aadac3aaead3bafad3cb1ad3c',
  'b2ad3db3ad3eb4ad3fb5ad3fb6ad40b7ad41b8ad42b9ad43baad44bcad45bdad46bead47bfad',
  '48c0ad49c1ad4bc2ad4cc3ad4dc4ad4fc5ad50c6ad52c7ad53c9ad55caad57cbad59ccad5bcd',
  'ad5ecdad60ceac62cfac65d0ad68d1ad6ad2ad6dd3ad70d4ad73d4ad76d5ae79d6ae7cd6af7f',
  'd7af82d8b085d9b188d9b18bdab28edbb391dbb494dcb596ddb599ddb69cdeb79edfb8a1dfb9',
  'a4e0bba6e1bca9e1bdabe2beaee3c0b0e4c1b2e4c2b5e5c4b7e6c5b9e6c7bbe7c8bee8cac0e9',
  'ccc2e9cdc4eacfc6ebd1c8ecd2caedd4ccedd6ceeed7d0efd9d2f0dbd4f1dcd6f1ded8f2e0da',
  'f3e1dcf4e3def5e5',
].join('');

const ROCKET_DATA = /* @__PURE__ */ [
  '03051a04051a05061b06071c07071d08081e0a091f0b09200d0a210e0b22100b23110c24130d',
  '25140e26160e27170f28180f291a102a1b112b1d112c1e122d20122e21133022133124143225',
  '14332715342815352a16362b16372d17382e173930173a31183b33183c34193d35193e37193f',
  '381a403a1a413c1a423d1a423f1b43401b44421b45431c46451c47461c48481c48491d494b1d',
  '4a4c1d4b4e1d4b501d4c511e4d531e4d541e4e561e4f581e4f591e505b1e515c1e515e1f5260',
  '1f52611f53631f53641f54661f54681f55691f556b1f566d1f566e1f57701f57711f57731f58',
  '751f58761f58781f597a1f597b1f597d1f5a7f1e5a811e5a821e5a841e5a861e5b871e5b891e',
  '5b8b1d5b8c1d5b8e1d5b901d5b921c5b931c5b951c5b971c5b981b5b9a1b5b9c1b5b9e1a5b9f',
  '1a5ba11a5ba3195ba4195ba6195aa8185aaa185aab185aad1759af1759b01759b21758b41658',
  'b51657b71657b91657ba1656bc1656bd1655bf1654c11754c21753c41753c51852c71951c819',
  '51ca1a50cb1b4fcd1c4ece1d4ecf1e4dd11f4cd2204cd3214bd5224ad62449d72549d82748d9',
  '2847db2946dc2b46dd2c45de2e44df2f44e03143e13342e23442e33641e43841e53940e63b40',
  'e73d3fe83f3fe8403ee9423eea443eeb463eeb483eec4a3eec4c3eed4e3eed503eee523fee54',
  '3fef5640ef5840ef5a41f05c42f05e42f06043f16244f16445f16646f26747f26948f26b49f2',
  '6d4bf26f4cf3714df3734ef37450f37651f37852f47a54f47c55f47d57f47f58f4815af4835b',
  'f4845df4865ef58860f58a61f58b63f58d64f58f66f59067f59269f5946bf5966cf5976ef599',
  '70f69b71f69c73f69e75f6a077f6a178f6a37af6a47cf6a67ef6a880f6a981f6ab83f6ad85f6',
  'ae87f6b089f6b18bf6b38df6b48ff6b691f6b893f6b995f6bb97f6bc99f6be9bf6bf9df6c19f',
  'f7c2a2f7c4a4f7c6a6f7c7a8f7c9aaf7caacf7ccaff7cdb1f7cfb3f7d0b5f8d1b8f8d3baf8d4',
  'bcf8d6bef8d7c0f8d9c3f8dac5f8dcc7f9ddc9f9dfcbf9e0cdf9e2d0f9e3d2f9e5d4fae6d6fa',
  'e8d8fae9dafaebdd',
].join('');

// Clamp to [0, 1]; non-finite input (NaN, ±Infinity beyond range) maps to 0.
function clamp01(t) {
  t = +t;
  return t > 0 ? (t < 1 ? t : 1) : 0;
}

// Build one colormap: a callable sampler (t -> '#rrggbb') carrying rgb, rgbf,
// css, palette, and colors. The anchor bytes are decoded from the packed hex
// string once, on first sample, into flat [r0, g0, b0, r1, g1, b1, ...].
function makeColormap(name, data) {
  let table = null;
  let colors = null;

  function bytes() {
    if (table === null) {
      table = new Uint8Array(768);
      for (let i = 0; i < 768; i++) {
        table[i] = parseInt(data.slice(i * 2, i * 2 + 2), 16);
      }
    }
    return table;
  }

  const map = (t) => {
    const T = bytes();
    const x = clamp01(t) * 255;
    const i = x | 0;
    const f = x - i;
    const a = i * 3;
    const b = (i < 255 ? i + 1 : 255) * 3;
    const r = Math.round(T[a] + (T[b] - T[a]) * f);
    const g = Math.round(T[a + 1] + (T[b + 1] - T[a + 1]) * f);
    const bl = Math.round(T[a + 2] + (T[b + 2] - T[a + 2]) * f);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
  };

  map.rgb = (t, out) => {
    const T = bytes();
    const x = clamp01(t) * 255;
    const i = x | 0;
    const f = x - i;
    const a = i * 3;
    const b = (i < 255 ? i + 1 : 255) * 3;
    const o = out ?? [0, 0, 0];
    o[0] = Math.round(T[a] + (T[b] - T[a]) * f);
    o[1] = Math.round(T[a + 1] + (T[b + 1] - T[a + 1]) * f);
    o[2] = Math.round(T[a + 2] + (T[b + 2] - T[a + 2]) * f);
    return o;
  };

  map.rgbf = (t, out) => {
    const T = bytes();
    const x = clamp01(t) * 255;
    const i = x | 0;
    const f = x - i;
    const a = i * 3;
    const b = (i < 255 ? i + 1 : 255) * 3;
    const o = out ?? [0, 0, 0];
    o[0] = (T[a] + (T[b] - T[a]) * f) / 255;
    o[1] = (T[a + 1] + (T[b + 1] - T[a + 1]) * f) / 255;
    o[2] = (T[a + 2] + (T[b + 2] - T[a + 2]) * f) / 255;
    return o;
  };

  map.css = (t) => {
    const [r, g, b] = map.rgb(t);
    return `rgb(${r}, ${g}, ${b})`;
  };

  map.palette = (n, start = 0, end = 1) => {
    n = Math.floor(n);
    if (!(n >= 1)) return [];
    if (n === 1) return [map(start)];
    const out = new Array(n);
    const step = (end - start) / (n - 1);
    for (let i = 0; i < n; i++) out[i] = map(start + step * i);
    return out;
  };

  Object.defineProperties(map, {
    name: { value: name, configurable: true },
    colors: {
      enumerable: true,
      get() {
        if (colors === null) {
          colors = Object.freeze(Array.from(
            { length: 256 },
            (_, i) => '#' + data.slice(i * 6, i * 6 + 6),
          ));
        }
        return colors;
      },
    },
  });

  return map;
}

/**
 * The colormaps. Each is a callable sampler — map(t) for t in [0, 1] returns
 * a '#rrggbb' hex string — carrying the full API as properties: map.rgb(t),
 * map.rgbf(t), map.css(t), map.palette(n, start, end), and map.colors.
 */
export const viridis = /* @__PURE__ */ makeColormap('viridis', VIRIDIS_DATA);
export const magma = /* @__PURE__ */ makeColormap('magma', MAGMA_DATA);
export const plasma = /* @__PURE__ */ makeColormap('plasma', PLASMA_DATA);
export const inferno = /* @__PURE__ */ makeColormap('inferno', INFERNO_DATA);
export const cividis = /* @__PURE__ */ makeColormap('cividis', CIVIDIS_DATA);
export const turbo = /* @__PURE__ */ makeColormap('turbo', TURBO_DATA);
export const mako = /* @__PURE__ */ makeColormap('mako', MAKO_DATA);
export const rocket = /* @__PURE__ */ makeColormap('rocket', ROCKET_DATA);

/**
 * All colormaps by name (frozen), for selecting one at runtime:
 * colormaps[userChoice](t).
 */
export const colormaps = /* @__PURE__ */ Object.freeze({
  viridis, magma, plasma, inferno, cividis, turbo, mako, rocket,
});

/**
 * Sample viridis as [r, g, b] integers in [0, 255]. Pass `out` (any
 * array-like with at least 3 slots) to avoid the allocation in hot loops.
 * Bound to viridis for backward compatibility; every map carries its own.
 */
export const rgb = viridis.rgb;

/**
 * Sample viridis as [r, g, b] floats in [0, 1] — handy for WebGL and shaders.
 * Pass `out` to avoid the allocation.
 */
export const rgbf = viridis.rgbf;

/**
 * Sample viridis as a CSS 'rgb(r, g, b)' string.
 */
export const css = viridis.css;

/**
 * n viridis hex colors evenly spaced over [start, end] (inclusive at both
 * ends). palette(5) -> ['#440154', '#3b528b', '#21918d', '#5dc863', '#fde725'].
 */
export const palette = viridis.palette;

/**
 * The 256 canonical viridis anchor colors as '#rrggbb' strings (frozen).
 */
export const colors = viridis.colors;

export default viridis;
