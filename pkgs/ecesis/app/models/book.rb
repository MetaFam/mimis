class Book < ApplicationRecord
  belongs_to :author, optional: true
  belongs_to :title
  has_many :contents, dependent: :destroy
  has_many :data, through: :contents
  has_many :entries, foreign_key: :nominee_id
  has_many :links, dependent: :destroy

  def self.for(author, title)
    author = Author.find_or_create_by(name: author)
    title = Title.find_or_create_by(name: title)
    find_or_create_by(author: author, title: title)
  end

  def possible_filenames
    @fnames ||= Filename.where(
      'name ILIKE ?', "%#{title}%"
    )
    .where(
      'name ILIKE ?', "%#{author}%"
    )
  end

  def found?
    puts "Checking: #{Rails.root}/public/book/by/#{author}/#{title}/html"
    Dir.glob("#{Rails.root}/public/book/by/#{author}/#{title}/*").length > 0
  end

  def to_s
    "#{author.name} - #{title.name}"
  end
end
