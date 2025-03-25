class SourceStringsController < ApplicationController
  before_action :set_source_string, only: [:show, :edit, :update, :destroy]

  # GET /source_strings
  # GET /source_strings.json
  def index
    @source_strings = SourceString.all
  end

  # GET /source_strings/1
  # GET /source_strings/1.json
  def show
  end

  # GET /source_strings/new
  def new
    @source_string = SourceString.new
  end

  # GET /source_strings/1/edit
  def edit
  end

  # POST /source_strings
  # POST /source_strings.json
  def create
    @source_string = SourceString.new(source_string_params)

    respond_to do |format|
      if @source_string.save
        format.html { redirect_to @source_string, notice: 'Source string was successfully created.' }
        format.json { render :show, status: :created, location: @source_string }
      else
        format.html { render :new }
        format.json { render json: @source_string.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /source_strings/1
  # PATCH/PUT /source_strings/1.json
  def update
    respond_to do |format|
      if @source_string.update(source_string_params)
        format.html { redirect_to @source_string, notice: 'Source string was successfully updated.' }
        format.json { render :show, status: :ok, location: @source_string }
      else
        format.html { render :edit }
        format.json { render json: @source_string.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /source_strings/1
  # DELETE /source_strings/1.json
  def destroy
    @source_string.destroy
    respond_to do |format|
      format.html { redirect_to source_strings_url, notice: 'Source string was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_source_string
      @source_string = SourceString.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def source_string_params
      params.require(:source_string).permit(:text)
    end
end
