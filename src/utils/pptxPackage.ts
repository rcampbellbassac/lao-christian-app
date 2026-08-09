import JSZip from 'jszip'
import type { AspectRatioPreset } from './aspectRatios'

export const PPTX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships'
const OFFICE_REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const PRESENTATION_NS = 'http://schemas.openxmlformats.org/presentationml/2006/main'
const DRAWING_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main'

function inchesToEmu(inches: number): number {
  return Math.round(inches * 914_400)
}

function relationshipsXml(relationships: string): string {
  return `${XML_HEADER}<Relationships xmlns="${REL_NS}">${relationships}</Relationships>`
}

function contentTypesXml(slideCount: number): string {
  const slides = Array.from(
    { length: slideCount },
    (_, index) =>
      `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
  ).join('')
  return `${XML_HEADER}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/><Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/><Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>${slides}</Types>`
}

function presentationXml(slideCount: number, width: number, height: number): string {
  const slideIds = Array.from(
    { length: slideCount },
    (_, index) => `<p:sldId id="${256 + index}" r:id="rId${index + 2}"/>`,
  ).join('')
  return `${XML_HEADER}<p:presentation xmlns:a="${DRAWING_NS}" xmlns:r="${OFFICE_REL_NS}" xmlns:p="${PRESENTATION_NS}" saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${slideIds}</p:sldIdLst><p:sldSz cx="${width}" cy="${height}" type="custom"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle><a:lvl1pPr><a:defRPr lang="lo-LA"/></a:lvl1pPr></p:defaultTextStyle></p:presentation>`
}

function presentationRelationshipsXml(slideCount: number): string {
  const slides = Array.from(
    { length: slideCount },
    (_, index) =>
      `<Relationship Id="rId${index + 2}" Type="${OFFICE_REL_NS}/slide" Target="slides/slide${index + 1}.xml"/>`,
  ).join('')
  const nextId = slideCount + 2
  return relationshipsXml(
    `<Relationship Id="rId1" Type="${OFFICE_REL_NS}/slideMaster" Target="slideMasters/slideMaster1.xml"/>${slides}<Relationship Id="rId${nextId}" Type="${OFFICE_REL_NS}/presProps" Target="presProps.xml"/><Relationship Id="rId${nextId + 1}" Type="${OFFICE_REL_NS}/viewProps" Target="viewProps.xml"/><Relationship Id="rId${nextId + 2}" Type="${OFFICE_REL_NS}/theme" Target="theme/theme1.xml"/><Relationship Id="rId${nextId + 3}" Type="${OFFICE_REL_NS}/tableStyles" Target="tableStyles.xml"/>`,
  )
}

function groupShapeXml(): string {
  return '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
}

function slideXml(index: number, width: number, height: number): string {
  return `${XML_HEADER}<p:sld xmlns:a="${DRAWING_NS}" xmlns:r="${OFFICE_REL_NS}" xmlns:p="${PRESENTATION_NS}"><p:cSld name="Slide ${index}"><p:spTree>${groupShapeXml()}<p:pic><p:nvPicPr><p:cNvPr id="2" name="Slide image ${index}" descr="Rendered LaoChristian.org slide"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${width}" cy="${height}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`
}

function slideMasterXml(): string {
  return `${XML_HEADER}<p:sldMaster xmlns:a="${DRAWING_NS}" xmlns:r="${OFFICE_REL_NS}" xmlns:p="${PRESENTATION_NS}"><p:cSld name="LaoChristian.org"><p:spTree>${groupShapeXml()}</p:spTree></p:cSld><p:clrMap accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" bg1="lt1" bg2="lt2" folHlink="folHlink" hlink="hlink" tx1="dk1" tx2="dk2"/><p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle><a:lvl1pPr><a:defRPr/></a:lvl1pPr></p:titleStyle><p:bodyStyle><a:lvl1pPr><a:defRPr/></a:lvl1pPr></p:bodyStyle><p:otherStyle><a:defPPr/><a:lvl1pPr><a:defRPr/></a:lvl1pPr></p:otherStyle></p:txStyles></p:sldMaster>`
}

function slideLayoutXml(): string {
  return `${XML_HEADER}<p:sldLayout xmlns:a="${DRAWING_NS}" xmlns:r="${OFFICE_REL_NS}" xmlns:p="${PRESENTATION_NS}" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>${groupShapeXml()}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`
}

function themeXml(): string {
  const solidFill = '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
  const line = (width: number) =>
    `<a:ln w="${width}" cap="flat" cmpd="sng" algn="ctr">${solidFill}<a:prstDash val="solid"/><a:miter lim="800000"/><a:headEnd type="none" w="med" len="med"/><a:tailEnd type="none" w="med" len="med"/></a:ln>`
  return `${XML_HEADER}<a:theme xmlns:a="${DRAWING_NS}" name="LaoChristian.org"><a:themeElements><a:clrScheme name="LaoChristian.org"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="173B38"/></a:dk2><a:lt2><a:srgbClr val="F6F1E7"/></a:lt2><a:accent1><a:srgbClr val="2E675E"/></a:accent1><a:accent2><a:srgbClr val="B86F50"/></a:accent2><a:accent3><a:srgbClr val="789B83"/></a:accent3><a:accent4><a:srgbClr val="88A7B0"/></a:accent4><a:accent5><a:srgbClr val="E5B957"/></a:accent5><a:accent6><a:srgbClr val="102B34"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="LaoChristian.org"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="LaoChristian.org"><a:fillStyleLst>${solidFill}${solidFill}${solidFill}</a:fillStyleLst><a:lnStyleLst>${line(6350)}${line(12700)}${line(19050)}</a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="lt1"/></a:solidFill>${solidFill}${solidFill}</a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`
}

function pngBase64(dataUrl: string): string {
  const match = /^data:image\/png;base64,(.+)$/s.exec(dataUrl)
  if (!match?.[1]) throw new Error('PPTX slides must be rendered as base64 PNG data URLs.')
  return match[1]
}

/** Builds a minimal standards-based PPTX containing one full-bleed PNG per slide. */
export async function buildImagePptx(
  pngDataUrls: string[],
  preset: AspectRatioPreset,
): Promise<Blob> {
  if (!pngDataUrls.length) throw new Error('At least one slide is required to create a PPTX file.')

  const width = inchesToEmu(preset.pptxInches.width)
  const height = inchesToEmu(preset.pptxInches.height)
  const zip = new JSZip()

  zip.file('[Content_Types].xml', contentTypesXml(pngDataUrls.length))
  zip.file(
    '_rels/.rels',
    relationshipsXml(
      `<Relationship Id="rId1" Type="${OFFICE_REL_NS}/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="${OFFICE_REL_NS}/extended-properties" Target="docProps/app.xml"/>`,
    ),
  )
  zip.file(
    'docProps/app.xml',
    `${XML_HEADER}<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>LaoChristian.org</Application><PresentationFormat>Custom</PresentationFormat><Slides>${pngDataUrls.length}</Slides><Notes>0</Notes><HiddenSlides>0</HiddenSlides><MMClips>0</MMClips><ScaleCrop>false</ScaleCrop><Company>LaoChristian.org</Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>1.0</AppVersion></Properties>`,
  )
  const now = new Date().toISOString()
  zip.file(
    'docProps/core.xml',
    `${XML_HEADER}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>LaoChristian.org presentation</dc:title><dc:creator>LaoChristian.org</dc:creator><cp:lastModifiedBy>LaoChristian.org</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`,
  )
  zip.file('ppt/presentation.xml', presentationXml(pngDataUrls.length, width, height))
  zip.file('ppt/_rels/presentation.xml.rels', presentationRelationshipsXml(pngDataUrls.length))
  zip.file(
    'ppt/presProps.xml',
    `${XML_HEADER}<p:presentationPr xmlns:a="${DRAWING_NS}" xmlns:r="${OFFICE_REL_NS}" xmlns:p="${PRESENTATION_NS}"/>`,
  )
  zip.file(
    'ppt/viewProps.xml',
    `${XML_HEADER}<p:viewPr xmlns:a="${DRAWING_NS}" xmlns:r="${OFFICE_REL_NS}" xmlns:p="${PRESENTATION_NS}"><p:normalViewPr/><p:slideViewPr><p:cSldViewPr><p:cViewPr><p:scale><a:sx n="1" d="1"/><a:sy n="1" d="1"/></p:scale><p:origin x="0" y="0"/></p:cViewPr><p:guideLst/></p:cSldViewPr></p:slideViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>`,
  )
  zip.file(
    'ppt/tableStyles.xml',
    `${XML_HEADER}<a:tblStyleLst xmlns:a="${DRAWING_NS}" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`,
  )
  zip.file('ppt/theme/theme1.xml', themeXml())
  zip.file('ppt/slideMasters/slideMaster1.xml', slideMasterXml())
  zip.file(
    'ppt/slideMasters/_rels/slideMaster1.xml.rels',
    relationshipsXml(
      `<Relationship Id="rId1" Type="${OFFICE_REL_NS}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="${OFFICE_REL_NS}/theme" Target="../theme/theme1.xml"/>`,
    ),
  )
  zip.file('ppt/slideLayouts/slideLayout1.xml', slideLayoutXml())
  zip.file(
    'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
    relationshipsXml(
      `<Relationship Id="rId1" Type="${OFFICE_REL_NS}/slideMaster" Target="../slideMasters/slideMaster1.xml"/>`,
    ),
  )

  pngDataUrls.forEach((dataUrl, index) => {
    const slideNumber = index + 1
    zip.file(`ppt/slides/slide${slideNumber}.xml`, slideXml(slideNumber, width, height))
    zip.file(
      `ppt/slides/_rels/slide${slideNumber}.xml.rels`,
      relationshipsXml(
        `<Relationship Id="rId1" Type="${OFFICE_REL_NS}/image" Target="../media/image${slideNumber}.png"/><Relationship Id="rId2" Type="${OFFICE_REL_NS}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>`,
      ),
    )
    zip.file(`ppt/media/image${slideNumber}.png`, pngBase64(dataUrl), { base64: true })
  })

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: PPTX_MIME_TYPE })
}
