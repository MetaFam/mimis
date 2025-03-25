class BooksController < ApplicationController
  before_action :set_book, only: [:show, :edit, :update, :destroy]

  # GET /books
  # GET /books.json
  def index
    @title = 'Books'
    @books = (
      Book.all
      .includes(:author)
      .includes(:title)
      .page(params[:page])
    )
  end

  # GET /books/1
  # GET /books/1.json
  def show
    @title = "Book: #{@book}"
    
    if @book.data.empty?
      @suggestions = (
        @book.possible_filenames
        .page(params[:page])
      )
    end
  end

  # GET /books/new
  def new
    @book = Book.new
  end

  # GET /books/1/edit
  def edit
  end

  # POST /books
  # POST /books.json
  def create
    @author = Author.find_or_create_by!(
      name: params[:author]
    )
    @title = Title.find_or_create_by!(
      name: params[:title]
    )
    @book = Book.find_or_create_by!(
      author: @author, title: @title
    )

    if params[:filename_id]
      @filename = Filename.find(params[:filename_id])
      @link = Link.find_or_create_by!(
        book: @book, filename: @filename
      )
    end

    respond_to do |format|
      if @book.save
        format.html { redirect_to @book, notice: 'Book was successfully created.' }
        format.json { render :show, status: :created, location: @book }
      else
        format.html { render :new }
        format.json { render json: @book.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /books/1
  # PATCH/PUT /books/1.json
  def update
    respond_to do |format|
      if @book.update(book_params)
        format.html { redirect_to @book, notice: 'Book was successfully updated.' }
        format.json { render :show, status: :ok, location: @book }
      else
        format.html { render :edit }
        format.json { render json: @book.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /books/1
  # DELETE /books/1.json
  def destroy
    @book.destroy
    respond_to do |format|
      format.html { redirect_to books_url, notice: 'Book was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_book
      @book = Book.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def book_params
      params.require(:book).permit(:author_id, :title_id)
    end
end
