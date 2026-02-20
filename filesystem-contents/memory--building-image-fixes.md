# Building Image Fixes — Feb 19, 2026

All 7 remaining broken images found on Wikimedia Commons. These need to be uploaded to S3 via Heroku.

## Images Ready for Upload

| ID | Building | City | Image URL |
|----|----------|------|-----------|
| 995 | Comcast Technology Center | Philly | https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/View_of_Center_City_%28Comcast_Technology_Center%29_%28Cropped_9_to_16%29.jpg/1280px-View_of_Center_City_%28Comcast_Technology_Center%29_%28Cropped_9_to_16%29.jpg |
| 1001 | Cathedral Basilica of SS Peter & Paul | Philly | https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Cathedral_Basilica_of_Saints_Peter_and_Paul_in_Philadelphia_20240528.jpg/1280px-Cathedral_Basilica_of_Saints_Peter_and_Paul_in_Philadelphia_20240528.jpg |
| 1002 | Elfreth's Alley | Philly | https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Philadelphia_-_Elfreths_Alley_-_20241031164637.jpg/1280px-Philadelphia_-_Elfreths_Alley_-_20241031164637.jpg |
| 1012 | Trinity Church | Boston | https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Trinity_Church%2C_Boston%2C_Massachusetts_-_front_oblique_view.JPG/1280px-Trinity_Church%2C_Boston%2C_Massachusetts_-_front_oblique_view.JPG |
| 1020 | John Hancock Tower | Boston | https://upload.wikimedia.org/wikipedia/commons/5/5e/John_Hancock_Tower%2C_200_Clarendon.jpg |
| 1023 | Isabella Stewart Gardner Museum | Boston | https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/20180527_-_05_-_Boston%2C_MA_%28Isabella_Stewart_Gardner_Museum%29.jpg/1280px-20180527_-_05_-_Boston%2C_MA_%28Isabella_Stewart_Gardner_Museum%29.jpg |
| 1024 | MIT Stata Center | Boston | https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Stata_Center_%2805689p%292.jpg/1280px-Stata_Center_%2805689p%292.jpg |

## How to Fix
Option A: Add a new rake task that takes building_id + URL, downloads, uploads to S3:
```ruby
# heroku run rake images:fix_single[1012,"https://upload.wikimedia.org/..."]
```

Option B: Heroku rails console:
```ruby
b = BuildingAnalysis.find(1012)
# use upload_image_to_s3 method from controller
```

Option C: Resubmit via browser using external_image_url field (but need browser relay)
