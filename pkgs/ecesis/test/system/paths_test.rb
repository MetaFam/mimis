require "application_system_test_case"

class PathsTest < ApplicationSystemTestCase
  setup do
    @path = paths(:one)
  end

  test "visiting the index" do
    visit paths_url
    assert_selector "h1", text: "Paths"
  end

  test "creating a Path" do
    visit paths_url
    click_on "New Path"

    fill_in "Elements", with: @path.elements
    fill_in "Serialization", with: @path.serialization
    click_on "Create Path"

    assert_text "Path was successfully created"
    click_on "Back"
  end

  test "updating a Path" do
    visit paths_url
    click_on "Edit", match: :first

    fill_in "Elements", with: @path.elements
    fill_in "Serialization", with: @path.serialization
    click_on "Update Path"

    assert_text "Path was successfully updated"
    click_on "Back"
  end

  test "destroying a Path" do
    visit paths_url
    page.accept_confirm do
      click_on "Destroy", match: :first
    end

    assert_text "Path was successfully destroyed"
  end
end
