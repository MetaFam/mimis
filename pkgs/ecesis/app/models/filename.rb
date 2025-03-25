class Filename < ApplicationRecord
  has_many :shares
  has_many :links

  MIMETYPES = {
    epub: 'application/epub+zip',
    html: 'text/html',
    xhtml: 'text/html',
    pdf: 'application/pdf',
    rar: 'application/x-rar-compressed',
    rtf: 'application/rtf',
    zip: 'application/zip',
  }

  def extension
    name.sub(/^.*\./, '').downcase
  end

  def possible_books
    @names ||= [].tap do |names|
      if name =~ /^(.*?) +by +(.*)\.(.*?)$/
        names.push({
          author: $2, title: $1
        })
      end
      if name =~ /^(.*?) +- +(.*)\.(.*?)$/
        names.push({
          author: $1, title: $2
        })
      end

      names.each do |n|
        n[:title].gsub!(/ *\([^\)]+\) */, '')
        n[:title].sub!(/^\[[^\]]+\] *- */, '')
      end
    end
  end

  def has_data?
    links.joins(book: :data).any?
  end

  def mimetype
    MIMETYPES[extension.to_sym] || 'unknown/unknown'
  end

  def to_s; name; end
end
