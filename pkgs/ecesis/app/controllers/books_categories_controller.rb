class BooksCategoriesController < ApplicationController
  before_action :set_books_category, only: [:show, :edit, :update, :destroy]

  # GET /books_categories
  # GET /books_categories.json
  def index
    @books_categories = BooksCategory.all
  end

  # GET /books_categories/1
  # GET /books_categories/1.json
  def show
  end

  # GET /books_categories/new
  def new
    @books_category = BooksCategory.new
  end

  # GET /books_categories/1/edit
  def edit
  end

  # POST /books_categories
  # POST /books_categories.json
  def create
    @books_category = BooksCategory.new(books_category_params)

    respond_to do |format|
      if @books_category.save
        format.html { redirect_to @books_category, notice: 'Books category was successfully created.' }
        format.json { render :show, status: :created, location: @books_category }
      else
        format.html { render :new }
        format.json { render json: @books_category.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /books_categories/1
  # PATCH/PUT /books_categories/1.json
  def update
    respond_to do |format|
      if @books_category.update(books_category_params)
        format.html { redirect_to @books_category, notice: 'Books category was successfully updated.' }
        format.json { render :show, status: :ok, location: @books_category }
      else
        format.html { render :edit }
        format.json { render json: @books_category.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /books_categories/1
  # DELETE /books_categories/1.json
  def destroy
    @books_category.destroy
    respond_to do |format|
      format.html { redirect_to books_categories_url, notice: 'Books category was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_books_category
      @books_category = BooksCategory.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def books_category_params
      params.require(:books_category).permit(:book_id, :category_id)
    end
end
