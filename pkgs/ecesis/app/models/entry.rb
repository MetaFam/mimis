class Entry < ApplicationRecord
  belongs_to :award
  belongs_to :category
  belongs_to :year
  belongs_to :nominee, class_name: 'Book'
  belongs_to :source_string, optional: true

  def to_s
    nominee&.to_s
  end

  def self.parse(json, award)
    json.each do |yr, data|
      year = Year.find_or_create_by(number: yr.to_i)
      data.each do |cat, data|
        category = Category.find_or_create_by(
          name: cat
        )

        data.each do |nominee|
          book = (
            Book.for(
              nominee['author'], nominee['title']
            )
          )
          source = SourceString.find_or_create_by(
            text: nominee['raw']
          )
          Entry.find_or_create_by(
            source_string: source,
            award: award,
            year: year,
            category: category,
            won: nominee['won'],
            nominee: book
          )
        end
      end
    end
  end
end
