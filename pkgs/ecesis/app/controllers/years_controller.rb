class YearsController < ApplicationController
  before_action :set_year, only: [:show, :edit, :update, :destroy]

  # GET /years
  # GET /years.json
  def index
    @years = Year.all
    if params[:award]
      @award = Award.find(params[:award])
      @years = @award.years
    end
    @years = @years.order(:number)
  end

  # GET /years/1
  # GET /years/1.json
  def show
  end

  # GET /years/new
  def new
    @year = Year.new
  end

  # GET /years/1/edit
  def edit
  end

  # POST /years
  # POST /years.json
  def create
    @year = Year.new(year_params)

    respond_to do |format|
      if @year.save
        format.html { redirect_to @year, notice: 'Year was successfully created.' }
        format.json { render :show, status: :created, location: @year }
      else
        format.html { render :new }
        format.json { render json: @year.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /years/1
  # PATCH/PUT /years/1.json
  def update
    respond_to do |format|
      if @year.update(year_params)
        format.html { redirect_to @year, notice: 'Year was successfully updated.' }
        format.json { render :show, status: :ok, location: @year }
      else
        format.html { render :edit }
        format.json { render json: @year.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /years/1
  # DELETE /years/1.json
  def destroy
    @year.destroy
    respond_to do |format|
      format.html { redirect_to years_url, notice: 'Year was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_year
      @year = Year.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def year_params
      params.require(:year).permit(:number)
    end
end
