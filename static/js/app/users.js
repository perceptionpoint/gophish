var groups = []

// Save attempts to POST or PUT to /groups/
function save(idx){
    var targets = []
    $.each($("#targetsTable").DataTable().rows().data(), function(i, target){
        targets.push({
            first_name : target[0],
            last_name: target[1],
            email: target[2],
            position: target[3]
        })
    })
    var group = {
        name: $("#name").val(),
        targets: targets
    }
    // Submit the group
    if (idx != -1) {
        // If we're just editing an existing group,
        // we need to PUT /groups/:id
        group.id = groups[idx].id
        api.groupId.put(group)
        .success(function(data){
            successFlash("Group updated successfully!")
            load()
            dismiss()
        })
        .error(function(data){
            modalError(data.responseJSON.message)
        })
    } else {
        // Else, if this is a new group, POST it
        // to /groups
        api.groups.post(group)
        .success(function(data){
            successFlash("Group added successfully!")
            load()
            dismiss()
        })
        .error(function(data){
            modalError(data.responseJSON.message)
        })
    }
}

function dismiss(){
    $("#targetsTable").dataTable().DataTable().clear().draw()
    $("#name").val("")
    $("#modal\\.flashes").empty()
    $("#modal").modal('hide')
}

function edit(idx){
    targets = $("#targetsTable").dataTable()
    $("#modalSubmit").unbind('click').click(function(){save(idx)})
    if (idx == -1) {
        group = {}
    } else {
        group = groups[idx]
        $("#name").val(group.name)
        $.each(group.targets, function(i, record) {
            targets.DataTable()
            .row.add([
                record.first_name,
                record.last_name,
                record.email,
                record.position,
                '<span style="cursor:pointer;"><i class="fa fa-trash-o"></i></span>'
            ]).draw()
        });
    }
    // Handle file uploads
    $("#csvupload").fileupload({
        dataType:"json",
        add: function(e, data){
            $("#modal\\.flashes").empty()
            var acceptFileTypes= /(csv|txt)$/i;
            var filename = data.originalFiles[0]['name']
            if (filename && !acceptFileTypes.test(filename.split(".").pop())) {
                modalError("Unsupported file extension (use .csv or .txt)")
                return false;
            }
            data.submit();
        },
        done: function(e, data){
            $.each(data.result, function(i, record) {
                targets.DataTable()
                .row.add([
                    record.first_name,
                    record.last_name,
                    record.email,
                    record.position,
                    '<span style="cursor:pointer;"><i class="fa fa-trash-o"></i></span>'
                ]).draw()
            });
        }
    })
}

function deleteGroup(idx){
    if (confirm("Delete " + groups[idx].name + "?")){
        api.groupId.delete(groups[idx].id)
        .success(function(data){
            successFlash(data.message)
            load()
        })
    }
}

function load(){
    $("#groupTable").hide()
    $("#emptyMessage").hide()
    $("#loading").show()
    api.groups.get()
    .success(function(gs){
        if (gs.length > 0){
            groups = gs
            $("#emptyMessage").hide()
            $("#loading").hide()
            $("#groupTable").show()
            groupTable = $("#groupTable").DataTable();
            groupTable.clear();
            $.each(groups, function(i, group){
                var targets = ""
                $.each(group.targets, function(i, target){
                    targets += target.email + ", "
                    if (targets.length > 50) {
                        targets = targets.slice(0,-3) + "..."
                        return false;
                    }
                })
                groupTable.row.add([
                    group.name,
                    targets,
                    moment(group.modified_date).format('MMMM Do YYYY, h:mm:ss a'),
                    "<div class='pull-right'><button class='btn btn-primary' data-toggle='modal' data-target='#modal' onclick='edit(" + i + ")'>\
                    <i class='fa fa-pencil'></i>\
                    </button>\
                    <button class='btn btn-danger' onclick='deleteGroup(" + i + ")'>\
                    <i class='fa fa-trash-o'></i>\
                    </button></div>"
                ]).draw()
            })
        } else {
            $("#loading").hide()
            $("#emptyMessage").show()
        }
    })
    .error(function(){
        errorFlash("Error fetching groups")
    })
}

$(document).ready(function(){
    load()
    $("#fileUpload").hover(function(){$("#fileUpload").tooltip('toggle')})
    // Setup the event listeners
    // Handle manual additions
    $("#targetForm").submit(function(){
        targets.DataTable()
        .row.add([
            $("#firstName").val(),
            $("#lastName").val(),
            $("#email").val(),
            $("#position").val(),
            '<span style="cursor:pointer;"><i class="fa fa-trash-o"></i></span>'
        ])
        .draw()
        $("#targetForm>div>input").val('')
        $("#firstName").focus()
        return false
    })
    // Handle Deletion
    $("#targetsTable").on("click", "span>i.fa-trash-o", function(){
        targets.DataTable()
        .row( $(this).parents('tr') )
        .remove()
        .draw();
    })
})