<?xml version="1.0"?>
<!--
  The files output by Calibre when converting from epub
  contain links to what were the files that the epub was
  decomposed into. The stylesheet copies everything
  except those links which it makes relative to the
  current document.
 -->
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"
                xmlns:html="http://www.w3.org/1999/xhtml">
  <xsl:template match="*">
    <xsl:copy>
      <xsl:copy-of select="@*"/>
      <xsl:apply-templates/>
    </xsl:copy>
  </xsl:template>
  <xsl:template match="html:link|html:a|a">
    <xsl:copy>
      <xsl:copy-of select="@*[not(name() = 'href')]" />
      <xsl:apply-templates select="@href" mode="relative"/>
      <xsl:apply-templates />
    </xsl:copy>
  </xsl:template>
  <xsl:template match="html:img|html:iframe|html:script">
    <xsl:copy>
      <xsl:copy-of select="@*[not(name() = 'src')]" />
      <xsl:apply-templates select="@src" mode="relative"/>
      <xsl:apply-templates />
    </xsl:copy>
  </xsl:template>
  <xsl:template match="html:form[@name='links']//html:option">
    <xsl:copy>
      <xsl:copy-of select="@*[not(name() = 'value')]" />
      <xsl:apply-templates select="@value" mode="relative"/>
      <xsl:apply-templates />
    </xsl:copy>
  </xsl:template>
  <xsl:template match="@*" mode="relative">
    <xsl:attribute name="{name()}">
      <xsl:choose>
        <xsl:when test="substring(., 4, 3) = '://'
                        or substring(., 5, 3) = '://'
                        or substring(., 1, 2) = '//'
                        or substring(., 1, 7) = 'mailto:'">
          <!-- already an absolute url: do nothing -->
          <xsl:value-of select="."/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:choose>
            <xsl:when test="substring-after(., '#') != ''">
              <xsl:value-of select="concat('#', substring-after(., '#'))"/>
            </xsl:when>
            <xsl:otherwise>
              <xsl:value-of select="."/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:attribute>
  </xsl:template>

  <!-- Allow images to be linked to -->
  <xsl:template match="html:img|img">
    <xsl:copy>
      <xsl:copy-of select="@*[not(name() = 'id')]" />
      <xsl:attribute name='id'>
        <xsl:text>img-</xsl:text>
        <xsl:value-of select='@src'/>
      </xsl:attribute>
      <xsl:apply-templates />
    </xsl:copy>
  </xsl:template>

  <!-- Insert styles for ereader -->
  <xsl:template match="html:head|head">
    <xsl:copy>
      <xsl:copy-of select="@*"/>
      <xsl:apply-templates />
      <script src='mimir.js'/>
      <link href='mimir.css' rel='stylesheet'/>
    </xsl:copy>
  </xsl:template>
</xsl:stylesheet>
