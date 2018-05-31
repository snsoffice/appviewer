define( [ 'ifuture', 'toolcase' ],

function( ifuture, Toolcase ) {

    SearchTool = function ( app, opt_options ) {
        Toolcase.call( this );

        this.name = 'search';
        this.title = '发现';

        this.searchResults = [
            {
                village: '绿地世纪城A区 - 11号楼',
                title: '1701',
                house_area: 69.56,
                house_type: '一室两厅',
                Creator: 'zhaojunde',
            },
            {
                village: '绿地世纪城A区 - 11号楼',
                title: '1701',
                house_area: 69.56,
                house_type: '一室两厅',
                Creator: 'zhaojunde',
            },
            {
                village: '绿地世纪城A区 - 11号楼',
                title: '1701',
                house_area: 69.56,
                house_type: '一室两厅',
                Creator: 'zhaojunde',
            }
        ];
    }
    ifuture.inherits( SearchTool, Toolcase );

    SearchTool.prototype.create = function ( container ) {
        var element = document.createElement( 'DIV' );
        element.className = 'dx-toolcase';

        var html = [
            '<nav class="navbar navbar-expand-sm navbar-light bg-light">' +
            '  <span class="navbar-brand mr-auto"> 发现 </span>' +
            '  <button class="bg-light text-secondary border-0 mx-2" type="button"><i class="fas fa-times"></i></button>' +
            '</nav>' +
            '<form class="m-5">' +
            '  <div class="form-group row">' +
            '    <label for="inputVillage" class="col-sm-2 col-form-label">小区</label>' +
            '    <div class="col-sm-10">' +
            '      <input type="text" class="form-control" id="inputVillage" placeholder="小区名称">' +
            '    </div>' +
            '  </div>' +
            '  <div class="form-group row">' +
            '    <label for="inputHouseType" class="col-sm-2 col-form-label">户型</label>' +
            '    <div class="col-sm-10">' +
            '      <input type="text" class="form-control" id="inputHouseType" placeholder="户型">' +
            '    </div>' +
            '  </div>' +
            '  <div class="form-group row">' +
            '    <label for="inputHouseArea1" class="col-sm-2 col-form-label">面积</label>' +
            '    <div class="col-sm-5">' +
            '      <input type="text" class="form-control" id="inputHouseArea1" placeholder="最小值">' +
            '    </div>' +
            '    <div class="col-sm-5">' +
            '      <input type="text" class="form-control" id="inputHouseArea2" placeholder="最大值">' +
            '    </div>' +
            '  </div>' +
            '  <button type="text" class="btn btn-primary">搜索</button>' +
            '  <button type="text" class="btn btn-link float-right">上次搜索结果</button>' +
            '</form>'
        ];


        html.push( '<div class="search-results m-1"><button type="text" class="btn btn-link float-right">重新搜索</button>' );
        if ( this.searchResults.length ) {
            html.push( '<div class="px-3 py-3 pt-md-5 pb-md-4 mx-auto text-center">' +
                       '  <h3>搜索结果</h3>' +
                       '</div>' +
                       '<div class="card-group">' );
            this.searchResults.forEach( function ( house ) {
                html.push( '<div class="card-deck mb-3 mx-auto text-center">' +
                           '  <div class="card mb-4 box-shadow">' +
                           '    <div class="card-header">' +
                           '      <h5 class="font-weight-normal">绿地世纪城A区</h5>' +
                           '    </div>' +
                           '    <div class="card-body">' +
                           '      <h5 class="card-title"><a href="#" class="text-primary">11号楼1单元1701</a></h5>' +
                           '      <ul class="list-unstyled mt-3 mb-4 text-muted">' +
                           '        <li>一室两厅</li>' +
                           '        <li>69.56平方米</li>' +
                           '        <li>这是我的房子</li>' +
                           '      </ul>' +
                           '      <p class="card-text text-right"><small class="text-muted">来自 zhaojunde的空间</small></p>' +
                           '    </div>' +
                           '  </div>' +
                           '</div>' );
            } );
            html.push( '</div>' );
        }
        html.push( '<button type="text" class="btn btn-link float-right">重新搜索</button></div>' );

        element.innerHTML = html.join( '' );

        element.querySelector( 'nav.navbar > button' ).addEventListener( 'click', function ( e ) {
            this.dispatchEvent( new ifuture.Event( 'task:close' ) );
        }.bind( this ), false );

        element.querySelector( 'form > button.btn-primary' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            // doSearch
            element.querySelector( 'form' ).style.display = 'none';
            element.querySelector( '.search-results' ).style.display = '';

        }, false );

        element.querySelector( 'form > button.btn-link' ).addEventListener( 'click', function ( e ) {
            e.preventDefault();
            element.querySelector( 'form' ).style.display = 'none';
            element.querySelector( '.search-results' ).style.display = '';
        }, false );

        Array.prototype.forEach.call(
            element.querySelectorAll( '.search-results > button.btn-link' ),
            function ( card ) {
                card.addEventListener( 'click', function ( e ) {
                    e.preventDefault();
                    element.querySelector( 'form' ).style.display = '';
                    element.querySelector( '.search-results' ).style.display = 'none';
                }, false );
            }
        );

        if ( this.searchResults.length ) {
            element.querySelector( 'form' ).style.display = 'none';
        }
        else {
            element.querySelector( '.search-results' ).style.display = 'none';
        }

        container.appendChild( element );
    };

    return SearchTool;

} );
