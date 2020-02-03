<?xml version="1.0"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"
                xmlns:html="http://www.w3.org/1999/xhtml">
  <xsl:param name="path" select="" />

  <xsl:template match="*">
    <xsl:copy>
      <xsl:copy-of select="@*"/>
      <xsl:apply-templates/>
    </xsl:copy>
  </xsl:template>
  <xsl:template match="html:link|html:a">
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
        <xsl:when test="substring(., 4, 3) = '://' or substring(., 5, 3) = '://'
                        or substring(., 1, 7) = 'mailto:'">
          <!-- already an absolute url: do nothing -->
          <xsl:value-of select="."/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="$path" />
          <xsl:if test=". != '.' or $path = ''">
            <xsl:value-of select="."/>
          </xsl:if>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:attribute>
  </xsl:template>
</xsl:stylesheet>
